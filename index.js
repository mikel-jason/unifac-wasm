const button = document.getElementById('render');
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

  wasm_bindgen('./pkg/raytrace_parallel_bg.wasm')
    .then(run)
    .catch(console.error);
}

loadWasm();

const { WorkerPool, unifac_test } = wasm_bindgen;

function run() {
  pool = new WorkerPool(navigator.hardwareConcurrency);

  // Configure various buttons and such.
  button.onclick = run_wasm
  button.innerText = 'Render!';
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

function run_wasm() {
  unifac_test(parseInt(concurrency.value) , pool)
}
