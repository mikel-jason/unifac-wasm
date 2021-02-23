import * as yaml from "js-yaml"

const button = document.getElementById('btn');
const concurrency = document.getElementById('concurrency');
const concurrencyAmt = document.getElementById('concurrency-amt');
button.disabled = true;
concurrency.disabled = true;

// First up, but try to do feature detection to provide better error messages
function loadWasm() {
  let msg = 'This demo requires a current version of Firefox (e.g., 79.0)';
  if (typeof SharedArrayBuffer !== 'function') {
    alert('this browser does not have SharedArrayBuffer support enabled' + '\n\n' + msg);
    return
  }
  // Test for bulk memory operations with passive data segments
  //  (module (memory 1) (data passive ""))
  const buf = new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
    0x05, 0x03, 0x01, 0x00, 0x01, 0x0b, 0x03, 0x01, 0x01, 0x00]);
  if (!WebAssembly.validate(buf)) {
    alert('this browser does not support passive wasm memory, demo does not work' + '\n\n' + msg);
    return
  }

  wasm_bindgen('./pkg/unifac-wasm_bg.wasm')
    .then(initialize)
    .catch(console.error);
}

loadWasm();

const { WorkerPool, unifac_test, Substance, Mixture } = wasm_bindgen;
let pool;

function initialize() {
  pool = new WorkerPool(navigator.hardwareConcurrency);

  button.onclick = click;
  button.disabled = false;

  concurrency.oninput = function() {
    concurrencyAmt.innerText = 'Concurrency: ' + concurrency.value;
  };
  concurrency.min = 1;
  concurrency.step = 1;
  concurrency.max = navigator.hardwareConcurrency;
  concurrency.value = concurrency.max;
  concurrency.oninput();
  concurrency.disabled = false;
}

const clearResults = function () {
    let table = document.getElementById('results')
    // row 0 is header
    while (table.rows.length > 1) {
        table.deleteRow(1)
    }
}

const addResultSubstance = function (name, data) {
    let table = document.getElementById('results')
    let row = table.insertRow(table.rows.length)
    let substanceCell = row.insertCell(0)
    let gammmaCell = row.insertCell(1)
    substanceCell.innerHTML = name
    gammmaCell.innerHTML = data.gamma
}

const click = function () {
    clearResults()

    let content = document.getElementById('yml').value
    let yml = yaml.load(content)
    try {

        const temperature = yml.temperature
        let mix = new Mixture(temperature)
        Object.values(yml.substances).forEach(substance => {
            let s = new Substance(substance.fraction)
            substance.groups.forEach(group => {
                let spl = group.split(":")
                s.add_functional_group(parseInt(spl[0]), parseFloat(spl[1]))
            })
            mix.add_substance(s)
        })

        mix.calc(parseInt(concurrency.value) , pool).then(res => res.forEach((gamma, index) => addResultSubstance(Object.keys(yml.substances)[index], gamma)))

    } catch (e) {
        clearResults()
        console.error("Error when calculating UNIFAC", e)
    }
}




