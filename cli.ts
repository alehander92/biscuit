import {Machine, Event, eventNames, asyncSleep} from './src/biscuit';

var blessed = require('blessed');

var screen = blessed.screen();

// a simple box for now

var box = blessed.box({
    top: 'center',
    left: 'center',
    width: '50%',
    height: '100%',
    content: ''
});

screen.append(box);
screen.render();

// the time for each pulse

const PULSE_TIME = 1000;

// the machine we'll be using

var machine = new Machine(PULSE_TIME);

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
const TIMEOUT_SHOW = 200;

/*
  The text interface: maintains
  state and fields with TUI / machine related values
  
  it updates on events and re-renders several text lines
  containing a simple representation of some of the machine state
*/
class Text {
    lineCount: number;
    lines: string[][];
    screen: any;
    box: any;
    machine: Machine;

    constructor(box: any, screen: any, machine: Machine) {
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
        console.log(this.lineCount);
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
            // clear biscuits
            this.pulseCalculate();
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
        }
        this.renderLines();
    }


    renderLines() {
        for(var i = 0; i < this.lineCount; i += 1) {
            this.box.setLine(i, this.lines[i].join(''));
        }
        this.screen.render();
    }
    on() {
        this.lines[SWITCH_LINE] = ['[ off]', '[ pause]', '[*on]'];
        this.renderLines();
    }

    pause() {
        this.lines[SWITCH_LINE] = ['[ off]', '[*pause]', '[ on]'];
        this.renderLines();
    }

    off() {
        this.lines[SWITCH_LINE] = ['[*off]', '[ pause]', '[ on]'];
        this.renderLines();
    }

    showExtrude() {
        this.lines[1][EXTRUDER_COLUMN] = '| ';
        this.lines[BISCUIT_LINE][EXTRUDER_COLUMN] = '  ';
        setTimeout(() => {
            this.lines[1][EXTRUDER_COLUMN] = '  ';
            this.lines[BISCUIT_LINE][EXTRUDER_COLUMN] = '. ';
            this.renderLines();
        }, TIMEOUT_SHOW);
    }


    showStamp() {
        this.lines[1][STAMPER_COLUMN] = '| ';
        this.lines[BISCUIT_LINE][STAMPER_COLUMN] = '. ';
        setTimeout(() => {
            this.lines[1][STAMPER_COLUMN] = '  ';
            this.lines[BISCUIT_LINE][STAMPER_COLUMN] = '_ ';
            this.renderLines();
        }, TIMEOUT_SHOW);
    }

    showHeating() {
        this.lines[1][OVEN_COLUMN] = '. ';
    }

    showNotHeating() {
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

        for (var biscuit of this.machine.conveyor.biscuits) {
            this.lines[BISCUIT_LINE][biscuit.position] = '_ ';
        }
    }

}


function initText(screen: any, box: any, machine: Machine) {
    var text = new Text(box, screen, machine);

    for(var i = 0;i < text.lineCount; i += 1) {
        box.insertLine(i, '');
    }
    screen.render();

    text.renderLines();
    return text;
}

var text = initText(screen, box, machine);

screen.key(['enter'], (ch, key) => { machine.on(); text.on(); });
screen.key(['p'], (ch, key) => { machine.pause(); text.pause(); });
screen.key(['backspace'], (ch, key) => { machine.off(); text.off(); });
screen.key(['escape'], (ch, key) => { process.exit(0); });    
screen.render();

screen.render();

machine.handle(Event.All, (data: any, event: Event) => { 
    box.setLine(text.lineCount, eventNames[event] + ' ' + JSON.stringify(data));
    text.update(data, event);
   
    index += 1;
    // maybeChange(index);
});

async function maybeChange(i: number) {   
    if (i == 20) {
        machine.pause();
        await asyncSleep(5 * PULSE_TIME);
        machine.on();
    } else if (i == 80) {
        // console.log('off');
        machine.off();
    }
}



