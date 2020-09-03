/*
  The state of the switch
*/
enum Active {
    Off,
    Paused,
    On
};

// based on https://stackoverflow.com/a/13448477/438099 and Nim naming
var asyncSleep = function(time: number): Promise<void> {
    return new Promise<void>((resolve: () => void) => {
        setTimeout(resolve, time);
    });
}

/*
  The motor : it has a certain pulse time which we pass from the machine
*/
class Motor {
    active: boolean;
    machine: Machine;
    pulseTime: number;

    constructor(machine: Machine, pulseTime: number) {
        this.active = false;
        this.machine = machine;
        this.pulseTime = pulseTime;
    }

    on() {
        if (!this.active) {
            this.active = true;
            this.sendPulses();
        }
    }

    off() {
        this.active = false;
    }

    text() {
        return this.active ? 'on' : 'off';
    }

    async sendPulses(){
        while (this.active) {
            await asyncSleep(this.pulseTime);
            // console.log('pulse');
            this.machine.emit(Event.Pulse, {});
            this.machine.conveyor.pulse();
            this.machine.extruder.pulse();
            this.machine.stamper.pulse();
        }
    }
}

/* 
  Machine contains the other elements and some handlers
  which let one listen to events or wait asynchronously for them
  using the `handle` and `event` methods.
*/
class Machine {
    motor: Motor;
    conveyor: Conveyor;
    extruder: Extruder;
    stamper: Stamper;
    oven: Oven;
    switch: Switch;
    handlers: ((data: any, event: Event) => void)[][];

    constructor(motorPulseTime: number) {
        this.motor = new Motor(this, motorPulseTime);
        this.conveyor = new Conveyor(this);
        this.extruder = new Extruder(this);
        this.stamper = new Stamper(this);
        this.oven = new Oven(this);
        this.switch = new Switch(this);
        this.handlers = [];
    }

    loadEvents(event: Event): Event[] {
        var events = [event];
        if (event == Event.All) {
            events = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        }
        return events;
    }

    handle(event: Event, func: (data: any, event: Event) => void) {
        var events = this.loadEvents(event);
        for (var event of events) {
            if (this.handlers[event] === undefined) {
                this.handlers[event] = [];
            }
            this.handlers[event].push(func);
        }
    }

    removeHandlers(event: Event) {
        var events = this.loadEvents(event);
        for (var event of events) {
            this.handlers[event] = [];
        }
    }

    emit(event: Event, data: any) {
        // console.log('!', event);
        var events = this.loadEvents(event);
        for (var event of events) {
            if (this.handlers[event] !== undefined) {
                for (var handler of this.handlers[event]) {
                    handler(data, event);
                }
            }
        }
    }

    event(e: Event): Promise<void> {
        return new Promise<void>((resolve: () => void) => {
            // console.log('<-', e);
            this.handle(e, (data: any, _: Event) => { 
                // console.log('->', e);
                this.removeHandlers(e);
                resolve();
            });
        });
    }

    async on() {
        this.emit(Event.StartMachine, {});
        this.oven.on();
        await this.oven.waitWarmedUp();
        this.extruder.on();
        this.stamper.on();
        this.conveyor.on();
        this.motor.on();

    }

    off() {
        this.extruder.off();
        this.stamper.offAfterNext();
        this.conveyor.offAfterNoBiscuits(() => { this.oven.off(); this.motor.off(); this.emit(Event.StopMachine, {});});
    }

    pause() {
        this.motor.off();
        this.extruder.off();
        this.stamper.off();
        this.conveyor.off();
        this.emit(Event.PauseMachine, {});
    }
}

class Biscuit {
    position: number;
    ready: boolean;

    constructor() {
        this.position = 0;
        this.ready = false;
    }

    finish() {
        this.ready = true;
    }
}

/* 
  Conveyor contains a lot of the
  actual biscuit moving logic: overally we just simulate stuff in
  discrete moments, so it's not really a very realistic physical simulation
*/
class Conveyor {
    machine: Machine;
    speedPerPulse: number;
    length: number;
    active: boolean;
    biscuits: Biscuit[];
    ovenPosition: number;
    biscuitCount: number;
    stopAfterNoBiscuits: boolean;
    offCallback?: () => void;

    constructor(machine: Machine) {
        this.machine = machine;
        this.speedPerPulse = 1; // TODO: maybe config it eventually
        this.length = 5; // TODO: maybe config it eventually
        this.active = false;
        this.biscuits = [];
        this.ovenPosition = 3;
        this.biscuitCount = 0;
        this.stopAfterNoBiscuits = false;
        this.offCallback = undefined;
    }

    on() {
        this.active = true;
    }

    off() {
        this.active = false;
    }

    offAfterNoBiscuits(callback: () => void) {
        this.stopAfterNoBiscuits = true;
        this.offCallback = callback;
    }

    pulse() {
        if (this.active) {
            for (var biscuit of this.biscuits) {
                biscuit.position += this.speedPerPulse;
                if (biscuit.position == this.ovenPosition) {
                    this.machine.emit(Event.Bake, {temp: this.machine.oven.temp});
                } else if (biscuit.position >= this.length) {
                    this.biscuitCount += 1;
                    this.biscuits = this.biscuits.slice(1);
                    this.machine.emit(Event.Finish, {});
                }
            }
            if (this.biscuits.length == 0) {
                if (this.stopAfterNoBiscuits) {
                    this.stopAfterNoBiscuits = false;
                    this.off();
                    if (this.offCallback) {
                        this.offCallback();
                    }
                }
            }
        }
    }

    startBiscuit() {
        this.biscuits.push(new Biscuit());
    }
}

class Extruder {
    machine: Machine;
    productSize: number;
    active: boolean;

    constructor(machine: Machine) {
        this.machine = machine;
        this.active = false;
    }

    on() {
        this.active = true;
    }

    off() {
        this.active = false;
    }

    pulse() {
        if (this.active) {
            if (this.productSize < 10) {
                this.machine.emit(Event.Error, {message: 'not enough product'})
            }
            else {
                this.productSize -= 10; // TODO is this good enough? do we want it configurable
                this.machine.conveyor.startBiscuit();
                this.machine.emit(Event.Extrude, {});
            }
        }
    }
}

class Stamper {
    machine: Machine;
    active: boolean;
    stopAfterNext: boolean;

    constructor(machine: Machine) {
        this.machine = machine;
        this.active = false;
        this.stopAfterNext = false;
    }

    on() {
        this.active = true;
    }

    off() {
        this.active = false;
    }

    offAfterNext() {
        this.stopAfterNext = true;
    }

    pulse() {
        // console.log('stopAfterNext');
        if (this.active) {
            this.machine.emit(Event.Stamp, {});
        }
        if (this.stopAfterNext) {
            this.stopAfterNext = false;
            this.off();
        }
    }
}

class Oven {
    machine: Machine;
    temp: number;
    minTemp: number;
    maxTemp: number;
    heatingElement: HeatingElement;
    active: boolean;
    sleepTime: number;
    warmUpResolve?: () => void;

    
    constructor(machine: Machine) {        
        this.machine = machine;
        // TODO : do we need to configure those? sorry, decided to not do it for now
        this.temp = 20; // TODO
        this.minTemp = 220; // TODO
        this.maxTemp = 240; // TODO
        this.heatingElement = new HeatingElement(machine, this);
        this.active = false;
        this.sleepTime = 100; // TODO
        this.warmUpResolve = undefined;
    }

    async on() {
        this.active = true;
        this.heatingElement.on();
        while (true) {
            await asyncSleep(this.sleepTime);
            if (this.temp < this.maxTemp) {
                this.heatingElement.run();
            } else {
                this.heatingElement.off();
            }
            this.checkTemp();
        }
    }

    off() {
        this.active = false;
        this.heatingElement.off();
        this.temp = 20; // simplifying a bit
        // we don't simulate the cooling while it's off
    }

    waitWarmedUp(): Promise<void> {
        var self = this;
        return new Promise<void>((resolve: () => void) => {
            self.warmUpResolve = resolve;
        });
    }

    checkTemp() {
        if (this.temp >= this.minTemp && this.temp <= this.maxTemp) {
            if (this.warmUpResolve) {
                this.warmUpResolve();
            }
        }
        if (this.temp == this.maxTemp) {
            this.heatingElement.off();
        }
        
        if (this.temp > this.maxTemp) {
            this.machine.emit(Event.Error, {message: 'temperature too high ' + this.temp});
        }
    }
}

class HeatingElement {
    machine: Machine;
    active: boolean;
    oven: Oven;
    tempIncrease: number;

    constructor(machine: Machine, oven: Oven) {
        this.machine = machine;
        this.active = false;
        this.oven = oven;
    }

    run() {
        if (this.active) {
            this.oven.temp += 10;
        }
    }

    on() {
        if (!this.active) {
            this.active = true;
            this.machine.emit(Event.StartHeat, {current: this.oven.temp});
        }
    }

    off() {
        if (this.active) {
            this.active = false;
            this.machine.emit(Event.StopHeat, {current: this.oven.temp});
        }
    }
}

class Switch {
    active: Active;
    motor: Motor;
    machine: Machine;

    constructor (machine: Machine) {
        this.active = Active.Off;
        this.motor = machine.motor;
        this.machine = machine;
    }

    on() {
        if (this.active != Active.On) {
            this.active = Active.On;
            this.machine.on();
        }
    }

    off() {
        this.active = Active.Off;
    }

    pause() {
        this.active = Active.Paused;
    }

    toggle() {
        // next step
        this.active = (this.active + 1) % 3;
        // console.log(this.active);
    }

    text() {
        switch (this.active) {
          case Active.On: return 'on';
          case Active.Off: return 'off';
          case Active.Paused: return 'paused';
        }
    }
}


/* 
  The events that one can wait for or listen for
  Event.All should map to all the others
*/
enum Event {
    Extrude,
    Stamp,
    StartHeat,
    StopHeat,
    Bake,
    Finish,
    StartMachine,
    PauseMachine,
    StopMachine,
    Pulse,
    Error,
    All
}

var eventNames = ['Extrude', 'Stamp', 'StartHeat', 'StopHeat', 'Bake', 'Finish', 
                  'StartMachine', 'PauseMachine', 'StopMachine', 'Pulse', 'Error', 'All']

export {Machine, Event, eventNames, asyncSleep};
