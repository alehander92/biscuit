## biscuit

a homework : a biscuit machine.

### structure

`src/biscuit.ts` is the lib file. it can be used in cli or web apps.

`cli.ts` is a cli app that uses the `blessed` lib for console TUI.
I use it as a simple example of a basic user interface and usage(and to debug my code).

`spec/test.ts` is a simple test suite using the `jasmine` lib.

### notes

* I implement a simple simulation of the machine: not very realistic as it usually just waits
for some periods between simulating events.
* Not absolutely sure if all the logic is bug free yet, I also assumed a lot of behavior.
* The TUI is unpolished

### build and run

```bash
npm run build 
npm run test # for testing
# those assume npx tsc works
```

```bash
node cli.js
```

controls are

* `enter` for `on`
* `p` for `pause`
* `backspace` for `off`

### code

I use `prettier` to format it.



