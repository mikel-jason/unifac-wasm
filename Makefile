WASM_DIR=pkg
WASM_NAME=raytrace_parallel
build:
	echo "Compiling to wasm"
	rm -rf pkg || 0
	RUSTFLAGS=' -C target-feature=+atomics,+bulk-memory' wasm-pack --verbose build --target no-modules --out-dir $(WASM_DIR) --out-name $(WASM_NAME)

setup:
	rustup override set nightly # -Z flag only works on nightly