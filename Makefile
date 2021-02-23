WASM_DIR=server/pkg
WASM_NAME=unifac-wasm

start: compile serve

compile:
	echo "Compiling to wasm"
	rm -rf $(WASM_DIR) || 0
	RUSTFLAGS=' -C target-feature=+atomics,+bulk-memory' wasm-pack --verbose build --target no-modules --out-dir $(WASM_DIR) --out-name $(WASM_NAME)

serve:
	cd server && npm start

setup:
	rustup override set nightly # -Z flag only works on nightly
	cd server && npm install && cd .. # install server dependencies