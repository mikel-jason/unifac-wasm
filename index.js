import * as unifac from "./pkg/unifac_wasm.js";
//import * as yaml from "js-yaml"

function download(data, filename, type) {
    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}

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

const click_measurement = function () {
    clearResults()

    let runs = parseInt(document.getElementById('runs').value)
    console.log("runs: " + runs)

    if(runs === NaN || runs === undefined || runs <= 0) {
        console.error("Invalid number of runs: " + runs)
        return;
    }

    let content = document.getElementById('yml').value
    let yml = JSON.parse(content)
    let k = 0 
    let j = 0
    try {
        const tempdifferences = yml.difftemp
        const fractions = yml.fractions
        let substances = Object.values(yml.substances)
        let result_text = ""
        let mixes = []

        for (j = 0; j < 10000; j++) {
            const temperature = yml.temperature + tempdifferences[j]
            let mix = new unifac.Mixture(temperature)
            for (let i = 0; i < substances.length; i++) {
                let s = (new unifac.Substance(fractions[j % 1000][i]))
                substances[i].groups.forEach(group => {
                    let spl = group.split(":")
                    s.add_functional_group(parseInt(spl[0]), parseFloat(spl[1]))
                })
                mix.add_substance(s)
            }
            mixes.push(mix)
        }
        console.log("Setup finished");

        for (k = 0; k < runs; k++) {
            let start = performance.now()
            for (j = 0; j < 10000; j++) {
                let res = mixes[j].calc()
            }
            let time = performance.now() - start
            result_text += k + ", " + time + "\n"
            if (k % 1 == 0) {
                console.log(k)
            } 
            if ((k + 1) % 50 == 0) {
                download(result_text, k + "_measurement.csv", "csv")
            }
        }

        download(result_text, "old_measurement.csv", "csv")

    } catch (e) {
        console.log("$ " +  k + " " + j)
        clearResults()
        console.error("Error when calculating UNIFAC", e)
    }
}


document.getElementById('btn').addEventListener('click', click)
document.getElementById('btnMeasurement').addEventListener('click', click_measurement)
