import * as unifac from "./pkg/unifac_wasm.js";
//import * as yaml from "js-yaml"

// Use ES module import syntax to import functionality from the module
// that we have compiled.
//
// Note that the `default` import is an initialization function which
// will "boot" the module and make it ready to use. Currently browsers
// don't support natively imported WebAssembly as an ES module, but
// eventually the manual initialization won't be required!
import init, { initThreadPool, add } from './pkg/unifac_wasm.js';

async function run() {
// First up we need to actually load the wasm file, so we use the
// default export to inform it where the wasm file is located on the
// server, and then we wait on the returned promise to wait for the
// wasm to be loaded.
//
// It may look like this: `await init('./pkg/without_a_bundler_bg.wasm');`,
// but there is also a handy default inside `init` function, which uses
// `import.meta` to locate the wasm file relatively to js file.
//
// Note that instead of a string you can also pass in any of the
// following things:
//
// * `WebAssembly.Module`
//
// * `ArrayBuffer`
//
// * `Response`
//
// * `Promise` which returns any of the above, e.g. `fetch("./path/to/wasm")`
//
// This gives you complete control over how the module is loaded
// and compiled.
//
// Also note that the promise, when resolved, yields the wasm module's
// exports which is the same as importing the `*_bg` module in other
// modes
    await init();

    try {
        await initThreadPool(navigator.hardwareConcurrency);
    } catch (e) {
        console.log("Error initializing threads");
    }
    // And afterwards we can use all the functionality defined in wasm.
    const result = add(1, 2);
    console.log(`1 + 2 = ${result}`);
    if (result !== 3)
        throw new Error("wasm addition doesn't work!");
}

run();

const clearResults = function () {
    let table = document.getElementById('results')
    // row 0 is header
    while (table.rows.length > 1) {
        table.deleteRow(1)
    }
}

const addResultSubstance = function (name, gamma) {
    let table = document.getElementById('results')
    let row = table.insertRow(table.rows.length)
    let substanceCell = row.insertCell(0)
    let gammmaCell = row.insertCell(1)
    substanceCell.innerHTML = name
    gammmaCell.innerHTML = gamma
}

const click = function () {
    clearResults()

    let content = document.getElementById('yml').value
    //let jsonres = unifac.convert(content);
    let yml = JSON.parse(content);
    try {

        const temperature = yml.temperature
        let mix = new unifac.Mixture(temperature)
        Object.values(yml.substances).forEach(substance => {
            let s = new unifac.Substance(substance.fraction)
            substance.groups.forEach(group => {
                let spl = group.split(":")
                s.add_functional_group(parseInt(spl[0]), parseFloat(spl[1]))
            })
            mix.add_substance(s)
        })

        let res = mix.calc()
        res.forEach((gamma, index) => addResultSubstance(Object.keys(yml.substances)[index], gamma))

    } catch (e) {
        clearResults()
        console.error("Error when calculating UNIFAC", e)
    }
}


document.getElementById('btn').addEventListener('click', click)
