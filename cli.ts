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

screen.append(box);
screen.render();

var machine = new Machine();

var i = 0;

machine.handle(Event.All, (data, event) => { 
	// console.log(eventNames[event], data);
	box.insertLine(i, eventNames[event] + ' ' + JSON.stringify(data));
	screen.render();
	i += 1;
	maybeChange(i);
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

machine.on();



