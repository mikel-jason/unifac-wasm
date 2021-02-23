# UNIFAC WebAssembly Demo App

Demo setup and web app for Rust [unifac](https://github.com/sarcaustech/unifac) crate as WebAssembly app.

---

## Prerequisites
- Rust and Cargo ([install](https://doc.rust-lang.org/cargo/getting-started/installation.html))
- Node and npm ([install](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm))
- wasm-pack ([install](https://rustwasm.github.io/wasm-pack/installer/))

## Installation
- Clone this repo
```
git clone https://github.com/sarcaustech/unifac-wasm.git
```
- Go into repo 
```
cd unifac-wasm
```
- Setup the environment. This means 
  - Switching to Rust nightly toolchain (in this project only)
  - Installing web app dependencies
```
make setup
```
- Build and run app
```
make
```

## Usage

Access web app at [http://localhost:8080](http://localhost:8080). The interface provides a demo mixture specifying multiple substances and functional groups. Add substances and functional groups as shown. For group IDs, see [used data source](http://www.ddbst.com/published-parameters-unifac.html).

The input format matches the input format used in [unifac-cli](https://github.com/sarcaustech/unifac-cli).

## Developing

For developing, use `make compile` to compile Rust to WASM and `make serve` to run the webpack server (separately).

## See also
- [unifac on GitHub](https://github.com/sarcaustech/unifac)
- [unifac on crates.io](https://crates.io/crates/unifac)
- [unifac documentation on docs.rs](https://docs.rs/unifac)
- [unifac-cli](https://github.com/sarcaustech/unifac-cli): A command-line tool leveraging this crate. As input, it uses simple YAML files as input
- [Parallel WASM with Rayon (wasm_bindgen example)](https://rustwasm.github.io/docs/wasm-bindgen/examples/raytrace.html)

## Project origin
This repo originates from a University project at [Baden-Wuerttemberg Cooperative State University (DHBW)](https://www.dhbw.de/english/home) by [sarcaustech](https://github.com/sarcaustech) and [heringerp](https://github.com/heringerp).

