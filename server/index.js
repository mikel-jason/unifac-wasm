import * as unifac from "unifac-wasm"
import * as yaml from "js-yaml"

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


document.getElementById('btn').addEventListener('click', click)
