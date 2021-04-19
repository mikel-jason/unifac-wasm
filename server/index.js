'use strict';

import * as unifac from "unifac-wasm"
import * as yaml from "js-yaml"

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
    let yml = yaml.load(content)
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

    let content = document.getElementById('yml').value
    let yml = yaml.load(content)
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

        for (k = 0; k < 1000; k++) {
            let start = performance.now()
            for (j = 0; j < 10000; j++) {
                let res = mixes[j].calc()
            }
            let time = performance.now() - start
            result_text += k + ", " + time + "\n"
            if (k % 100 == 0) {
                console.log(k)
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
document.getElementById('btnm').addEventListener('click', click_measurement)
