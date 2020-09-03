import { Machine, Event, eventNames, asyncSleep } from "../src/biscuit";

// a very simple sequence of tests
describe("biscuit machine", function () {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;

  const TEST_PULSE_TIME = 100;

  it("on works in a simple case", async function () {
    var machine = new Machine(TEST_PULSE_TIME);

    await machine.on();
    expect(machine.motor.active).toBe(true);

    await machine.event(Event.Extrude);
    expect(machine.conveyor.biscuits[0].position).toBe(0);

    await machine.event(Event.Extrude);
    expect(machine.conveyor.biscuits[0].position).toBe(1);

    await machine.event(Event.Finish);
    expect(
      machine.conveyor.biscuits.map((b) => {
        return b.position;
      })
    ).toEqual([4, 3, 2, 1, 0]);
    expect(machine.conveyor.biscuitCount).toBe(1);

    machine.pause();
  });

  it("off works in a simple case", async function () {
    var machine = new Machine(TEST_PULSE_TIME);

    await machine.on();
    for (var i = 0; i < 5; i += 1) {
      await machine.event(Event.Extrude);
    }
    await machine.event(Event.Finish);
    machine.off();
    expect(machine.extruder.active).toBe(false);
    expect(machine.conveyor.biscuits.length).toBe(5);

    await machine.event(Event.Stamp);
    expect(machine.stamper.active).toBe(false);

    await machine.event(Event.StopMachine);
    expect(machine.conveyor.biscuits.length).toBe(0);
  });

  it("pause works in a simple case", async function () {
    var machine = new Machine(TEST_PULSE_TIME);

    await machine.on();
    for (var i = 0; i < 5; i += 1) {
      await machine.event(Event.Extrude);
    }
    expect(machine.motor.active).toBe(true);

    machine.pause();
    expect(machine.motor.active).toBe(false);
  });
});
