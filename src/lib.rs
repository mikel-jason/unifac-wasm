use rayon::prelude::*;
use wasm_bindgen::prelude::*;

macro_rules! console_log {
    ($($t:tt)*) => (crate::log(&format_args!($($t)*).to_string()))
}

mod pool;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn logv(x: &JsValue);
}


#[wasm_bindgen]
pub fn unifac_test (
    concurrency: usize,
    pool: &pool::WorkerPool,
)  {

    let thread_pool = rayon::ThreadPoolBuilder::new()
        .num_threads(concurrency)
        .spawn_handler(|thread| Ok(pool.run(|| thread.run()).unwrap()))
        .build()
        .unwrap();

    pool.run(move || {
        let mut res: String = "Init'ed".to_string();
        thread_pool.install(|| {
            let vec = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            let vec_pow: Vec<i32> = vec.par_iter().map(|i| i32::pow(*i, 4)).collect();
            res = format!("Total is {}", vec_pow.iter().sum::<i32>());
            log(res.as_str());
        });
    }).unwrap();
}
