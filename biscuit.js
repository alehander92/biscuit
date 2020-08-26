var Motor = (function () {
    function Motor() {
        this.active = false;
    }
    Motor.prototype.on = function () {
        this.active = true;
    };
    Motor.prototype.off = function () {
        this.active = false;
    };
    Motor.prototype.toggle = function () {
        this.active = !this.active;
    };
    Motor.prototype.textState = function () {
        return this.active ? 'on' : 'off';
    };
    return Motor;
})();
var motor = new Motor();
exports.motor = motor;
// motor.on();
// Pipeline(motor, extruder, oven);
// while (1) {
// 	//await sleep(500);
// 	await display();
// }
// --|--~--#-#-#-------
