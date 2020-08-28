<script>
    import {machine} from '../biscuit';
    export let name;
    
    var buttonText = machine.switch.text();

    function toggleSwitch() {
        machine.switch.toggle();
        buttonText = machine.switch.text();
        console.log(buttonText);
    }

    // switch: toggle motor -> on off pause
    // just run a single conveyor

    // events : on each period 

</script>

<main>

    <h1>Hello {name}!</h1>
    <p>Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn how to build Svelte apps.</p>

    <button on:click={toggleSwitch}>
      {buttonText}
    </button>

</main>

<style>
    main {
        text-align: center;
        padding: 1em;
        max-width: 240px;
        margin: 0 auto;
    }

    h1 {
        color: #ff3e00;
        text-transform: uppercase;
        font-size: 4em;
        font-weight: 100;
    }

    @media (min-width: 640px) {
        main {
            max-width: none;
        }
    }
</style>
