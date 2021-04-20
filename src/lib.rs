use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn convert(input: String) -> js_sys::JsString {
    let json_from_yaml = serde_yaml::from_str::<serde_json::Value>(&input).unwrap();
    js_sys::JsString::from(json_from_yaml.as_str().unwrap())
}

#[wasm_bindgen]
pub fn add(a: u32, b: u32) -> u32 {
    a + b
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
