#![feature(test)]

extern crate web_sys;
use web_sys::console;

use wasm_bindgen::prelude::*;

pub struct Timer<'a> {
    name: &'a str,
}

impl<'a> Timer<'a> {
    pub fn new(name: &'a str) -> Timer<'a> {
        console::time_with_label(name);
        Timer { name }
    }
}

impl<'a> Drop for Timer<'a> {
    fn drop(&mut self) {
        console::time_end_with_label(self.name);
    }
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
    pub fn add_substance(&mut self, substance: Substance) -> Self {
        let s = unifac::Substance::from(substance.fraction, substance.functional_groups);
        self.substances.push(s);
        self.clone()
    }

    #[wasm_bindgen]
    pub fn print(&self) -> js_sys::JsString {
        js_sys::JsString::from(format!("{:?}", self)).clone()
    }

    #[wasm_bindgen]
    pub fn calc(&self) -> js_sys::Array {
        match unifac::calc(self.substances.clone(), self.temperature) {
            Ok(res) => {
                let arr = js_sys::Array::new();
                for s in res {
                    arr.push(&JsValue::from_f64(s.gamma.unwrap()));
                }
                arr
            }
            Err(_) => js_sys::Array::new(),
        }

    }

    #[wasm_bindgen]
    pub fn time_calc1000(&self) -> js_sys::Number {
        console::log_1(&"Time calc".into());
        let window = web_sys::window().expect("Error finding window");
        let performance = window.performance().expect("Error getting performance");
        let start = performance.now();
        for _ in 0..10_000 {
            console::log_1(&"Looping".into());
            std::hint::black_box(self.calc());
        }
        return js_sys::Number::from(performance.now() - start);
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
    pub fn add_functional_group(&mut self, id: u8, nu: f64) -> Self {
        let fg = unifac::FunctionalGroup::from(id, nu).expect("FG add_functional_group");
        self.functional_groups.push(fg);
        self.clone()
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
