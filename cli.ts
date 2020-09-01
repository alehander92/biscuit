import {Machine, Event, eventNames, asyncSleep} from './biscuit';

var blessed = require('blessed');

var screen = blessed.screen();

var box = blessed.box({
    top: 'center',
    left: 'center',
    width: '50%',
    height: '100%',
    content: ''
});


var machine = new Machine();

var index = 0;

const SWITCH_LINE = 4;
const OFF_BUTTON = 0;
const PAUSE_BUTTON = 1;
const ON_BUTTON = 2;
const BISCUIT_LINE = 2;
const EXTRUDER_COLUMN = 0;
const STAMPER_COLUMN = 1;
const OVEN_COLUMN = 4;
const FINISH_COLUMN = 5;
const TIMEOUT_SHOW = 500;

class Text {
    lineCount: number;
    lines: string[][];
    screen: any;
    box: any;
    machine: Machine;

    constructor(screen: any, box: any, machine: Machine) {
        this.lines = [
            ['| ', '| ', '  ', '  ', '[]'],
            ['  ', '  ', '  ', '  ', '  '],
            ['  ', '  ', '  ', '  ', '  '],
            ['__', '__', '__', '__', '__', '    []'],

            ['[*off]', '[ pause]', '[ on]']
        ];

        this.lineCount = this.lines.length;

        this.screen = screen;

        this.box = box;

        this.machine = machine;
    }

    update(data: any, event: Event) {
        switch (event) {
         case Event.Extrude:
            this.showExtrude();
            break;
          case Event.Stamp:
            this.showStamp();
            break;
          case Event.StartHeat:
            this.showHeating();
          case Event.StopHeat:
            this.showNotHeating();
            break;
          case Event.Bake:
            this.showBaking();
            break;
          case Event.Finish:
            this.showFinish();
            break;
          case Event.StartMachine:
            break;
          case Event.PauseMachine:
            break;
          case Event.StopMachine:
            break;
          case Event.Error:
            console.log(data.message);
            process.exit(1);
            break;            
          case Event.Pulse:
            this.pulseCalculate();
            break;             
          default:
            // console.log(event);
            break;
          // this.screen.render();
        }
    }

    on() {
        this.lines[SWITCH_LINE] = ['[ off]', '[ pause]', '[*on]'];
        console.log('render on');
        // this.renderLines();
    }

    pause() {
        this.lines[SWITCH_LINE] = ['[ off]', '[*pause]', '[ on]'];
        console.log('render pause');
        this.screen.render();
    }

    off() {
        this.lines[SWITCH_LINE] = ['[*off]', '[ pause]', '[ on]'];
        console.log('render off');
        this.screen.render();
    }

    showExtrude() {
        this.lines[1][EXTRUDER_COLUMN] = '| ';
        this.lines[BISCUIT_LINE][EXTRUDER_COLUMN] = '  ';
        setTimeout(() => {
            console.log('after extrude');
            this.lines[1][EXTRUDER_COLUMN] = '  ';
            this.lines[BISCUIT_LINE][EXTRUDER_COLUMN] = '. ';
            this.screen.render();
        }, TIMEOUT_SHOW);
    }


    showStamp() {
        this.lines[1][STAMPER_COLUMN] = '| ';
        this.lines[BISCUIT_LINE][STAMPER_COLUMN] = '? ';
        setTimeout(() => {
            console.log('after stamp');
            this.lines[1][STAMPER_COLUMN] = '  ';
            this.lines[BISCUIT_LINE][STAMPER_COLUMN] = '_ ';
            console.log('after ', this.lines);
            this.screen.render();
        }, TIMEOUT_SHOW);
    }

    showHeating() {
        // console.log(1, OVEN_COLUMN);
        this.lines[1][OVEN_COLUMN] = '. ';
    }

    showNotHeating() {
        // console.log('not');
        this.lines[1][OVEN_COLUMN] = '  ';
    }

    showBaking() {
        this.lines[BISCUIT_LINE][OVEN_COLUMN] = '_ ';
    }

    showFinish() {
        this.lines[3][FINISH_COLUMN] = '     [_]';
    }

    pulseCalculate() {
        for (var i = 0;i < this.lines[BISCUIT_LINE].length; i += 1) {
            this.lines[BISCUIT_LINE][i] = '  ';
        }
        this.lines[BISCUIT_LINE][EXTRUDER_COLUMN] = '  ';
        this.lines[BISCUIT_LINE][STAMPER_COLUMN] = '  ';
        this.lines[3][FINISH_COLUMN] = '     []';

        // console.log(this.machine.conveyor.biscuits.map((b) => { return b.position; }));
        for (var biscuit of this.machine.conveyor.biscuits) {
            this.lines[BISCUIT_LINE][biscuit.position] = '_ ';
        }
    }

}




screen.append(box);
screen.render();

function initText(screen: any, box: any, machine: Machine) {
    var text = new Text(box, screen, machine);

    for(var i = 0;i < text.lineCount; i += 1) {
        box.insertLine(i, '');
    }
    screen.render();
    return text;
}

var text = initText(screen, box, machine);

screen.key(['enter'], (ch, key) => { machine.on(); text.on(); });
screen.key(['p'], (ch, key) => { machine.pause(); text.pause(); });
screen.key(['backspace'], (ch, key) => { machine.off(); text.off(); });
screen.key(['escape'], (ch, key) => { process.exit(0); });    
screen.render();

machine.handle(Event.All, (data: any, event: Event) => { 
    // console.log(eventNames[event], data);
    // index
    box.setLine(text.lineCount, eventNames[event] + ' ' + JSON.stringify(data));
    text.update(data, event);
    
    for(var i = 0; i < text.lineCount; i += 1) {
        // console.log(text.lines[0].join(''));
        box.setLine(i, text.lines[i].join(''));
    }
        
    // console.log('render handle');
    screen.render();
    index += 1;
    // maybeChange(index);
});

async function maybeChange(i: number) {   
    if (i == 20) {
        machine.pause();
        await asyncSleep(5000);
        machine.on();
    } else if (i == 80) {
        // console.log('off');
        machine.off();
    }
}

// machine.on();



