use rayon::prelude::*;
use wasm_bindgen::prelude::*;
use futures_channel::oneshot;
use js_sys::{Promise};

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
) {
    console_error_panic_hook::set_once();
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

#[wasm_bindgen]
#[derive(Debug, Clone)]
pub struct Substance {
    pub fraction: f64,
    pub gamma: Option<f64>,
    functional_groups: Vec<unifac::FunctionalGroup>,
}

#[wasm_bindgen]
#[derive(Debug, Clone)]
pub struct Mixture {
    pub temperature: f64,
    substances: Vec<unifac::Substance>,
}

#[wasm_bindgen]
impl Mixture {
    #[wasm_bindgen(constructor)]
    pub fn new(temperature: f64) -> Self {
        Self {
            temperature,
            substances: Vec::new(),
        }
    }

    #[wasm_bindgen]
    pub fn add_substance(&mut self, substance: Substance) {
        let s = unifac::Substance::from(substance.fraction, substance.functional_groups);
        self.substances.push(s);
    }

    #[wasm_bindgen]
    pub fn print(&self) -> js_sys::JsString {
        js_sys::JsString::from(format!("{:?}", self)).clone()
    }

    #[wasm_bindgen]
    pub fn calc (
        &self,
        concurrency: usize,
        pool: &pool::WorkerPool,
    ) -> Result<Promise, JsValue> {
        console_error_panic_hook::set_once();
        let thread_pool = rayon::ThreadPoolBuilder::new()
            .num_threads(concurrency)
            .spawn_handler(|thread| Ok(pool.run(|| thread.run()).unwrap()))
            .build()
            .unwrap();

        let subs = self.substances.clone();
        let temp = self.temperature.clone();

        let (tx, rx) = oneshot::channel();
        // let mut res: js_sys::Array = js_sys::Array::new();
        let mut res: Vec<unifac::Substance> = Vec::new();
        pool.run(move || {
            thread_pool.install(|| {

                res = unifac::calc(subs, temp).unwrap();
                /*
                res = match unifac::calc(subs, temp) {
                    Ok(r) => {
                        let arr = js_sys::Array::new();
                        for s in r {
                            arr.push(&JsValue::from_f64(s.gamma.unwrap()));
                        }
                        arr
                    }
                    Err(_) => js_sys::Array::new(),
                }
                */
            });
            drop(tx.send(res));
        })?;

        let done = async move {
            match rx.await {
                Ok(data) => Ok(JsValue::from_serde(&data).unwrap()),
                Err(_) => Err(JsValue::undefined()),
            }
        };

        Ok(wasm_bindgen_futures::future_to_promise(done))
    }
}

#[wasm_bindgen]
impl Substance {
    #[wasm_bindgen(constructor)]
    pub fn new(fraction: f64) -> Self {
        Substance {
            fraction,
            functional_groups: Vec::new(),
            gamma: None,
        }
    }

    #[wasm_bindgen]
    pub fn add_functional_group(&mut self, id: u8, nu: f64) {
        let fg = unifac::FunctionalGroup::from(id, nu).expect("FG add_functional_group");
        self.functional_groups.push(fg);
    }

    #[wasm_bindgen]
    pub fn print(&self) -> js_sys::JsString {
        let s: Vec<String> = self
            .functional_groups
            .iter()
            .map(|fg| format!("{} ({} times)", fg.id, fg.nu))
            .collect();
        let joined = s.join(" ");
        js_sys::JsString::from(joined).clone()
    }
}
