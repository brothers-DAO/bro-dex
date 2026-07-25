#Comment to disable Init
INIT=-D__INIT__

# Dont forget to set the pair modules here
MACROS=-DNS=n_f6aa9328b19b8bf7e788603bd669dcf549e07575

KEYS_DIR=keys/mainnet

DATA_FILE=mainnet.yaml

all: BRO-KDA-M

.SECONDARY:

.pact:
	mkdir -p .pact

.tkpl:
	mkdir -p .tkpl

.pact/rb-tree.pact: templates/rb-tree.pact.m4 ../pact_RB_tree/pact/rb-tree.pact | .pact
	m4 ${MACROS} ${INIT} $< > $@

.pact/bro-dex-core-%.pact: templates/bro-dex-core.pact.m4 ../pact/bro-dex-core.pact defs/%.m4 | .pact
	m4 ${MACROS} ${INIT} defs/$*.m4 $< > $@

.pact/bro-dex-view-%.pact: templates/bro-dex-view.pact.m4 ../pact/bro-dex-view.pact defs/%.m4 | .pact
	m4 ${MACROS} ${INIT} defs/$*.m4 $< > $@

.pact/bro-dex-wrapper-%.pact: templates/bro-dex-wrapper.pact.m4 ../pact/bro-dex-wrapper.pact defs/%.m4 | .pact
	m4 ${MACROS} ${INIT} defs/$*.m4 $< > $@

.tkpl/bro-dex-core-%.tkpl: templates/bro-dex-core.tkpl defs/%.m4 | .tkpl
	m4 ${MACROS} ${INIT} defs/$*.m4 $< > $@

.tkpl/bro-dex-view-%.tkpl: templates/bro-dex-view.tkpl defs/%.m4 | .tkpl
	m4 ${MACROS} ${INIT} defs/$*.m4 $< > $@

.tkpl/bro-dex-wrapper-%.tkpl: templates/bro-dex-wrapper.tkpl defs/%.m4 | .tkpl
	m4 ${MACROS} ${INIT} defs/$*.m4 $< > $@

tx-%.yaml: .tkpl/%.tkpl .pact/%.pact ${DATA_FILE}
	kda gen -t $< -o $@ -d ${DATA_FILE}

tx-%.json: tx-%.yaml
	kda sign $< -k ${KEYS_DIR}/gas.yaml
	kda sign $< -k ${KEYS_DIR}/admin.yaml
	kda sign $< -k ${KEYS_DIR}/ns.yaml

%: tx-bro-dex-core-%.yaml tx-bro-dex-view-%.yaml tx-bro-dex-wrapper-%.yaml
	@:

%-signed: tx-bro-dex-core-%.json tx-bro-dex-view-%.json tx-bro-dex-wrapper-%.json
	@:

tx-init.yaml: templates/init.tkpl ${DATA_FILE}
	kda gen -t $< -o $@ -d ${DATA_FILE}

clean:
	rm -rf .pact
	rm -rf .tkpl
	rm -f tx*.yaml
	rm -f tx*.json
