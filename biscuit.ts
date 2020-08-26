class Motor {
	active: boolean;

	constructor () {
		this.active = false;
	}

	on() {
		this.active = true;
	}

	off() {
		this.active = false;
	}

	toggle() {
		this.active = !this.active;
	}

	textState() {
		return this.active ? 'on' : 'off';
	}
}


var motor = new Motor();

export {motor};

// motor.on();

// Pipeline(motor, extruder, oven);


// while (1) {
// 	//await sleep(500);
// 	await display();
// }


// --|--~--#-#-#-------

