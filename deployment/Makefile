PAIR=BRO-zUSD-M
NS=n_f6aa9328b19b8bf7e788603bd669dcf549e07575

#Comment to disable Init
#INIT= -D__INIT__

# Dont forget to set the pair modules here
MACROS= -D__NAMESPACE__=${NS} \
        -DPAIR=${PAIR} \
        -D__QUOTE_MOD__=n_b742b4e9c600892af545afb408326e82a6c0c6ed.zUSD \
        -D__BASE_MOD__=n_582fed11af00dc626812cd7890bb88e72067f28c.bro \
        -D__MIN_AMOUNT__=0.001 \
        -D__MIN_PRICE__=1.0 \
        -D__DECIMALS__=6 \
        -D__FEE_ACOUNT__=r:${NS}.fees-collector \
        -DRB_TREE_NS=${NS} \

KEYS_DIR=keys/mainnet

DATA_FILE=mainnet.yaml

_DATA_FILE = $(basename ${DATA_FILE})_${PAIR}.yaml

.SECONDARY:

.pact:
	mkdir -p .pact

${_DATA_FILE}: ${DATA_FILE}
	m4 ${MACROS} $< > $@

.pact/rb-tree.pact: templates/rb-tree.pact.m4 ../pact_RB_tree/pact/rb-tree.pact | .pact
	m4 ${MACROS} ${INIT} $< > $@

.pact/%-${PAIR}.pact: templates/%.pact.m4 ../pact/%.pact | .pact
	m4 ${MACROS} ${INIT} $< > $@

tx-%-${PAIR}.yaml: templates/%.tkpl .pact/%-${PAIR}.pact ${_DATA_FILE}
	kda gen -t $< -o $@ -d ${_DATA_FILE}

tx-%.yaml: templates/%.tkpl .pact/%.pact ${_DATA_FILE}
	kda gen -t $< -o $@ -d ${_DATA_FILE}

tx-init.yaml: templates/init.tkpl ${_DATA_FILE}
	kda gen -t $< -o $@ -d ${_DATA_FILE}

%.json: %.yaml
	kda sign $< -k ${KEYS_DIR}/gas.yaml
	kda sign $< -k ${KEYS_DIR}/admin.yaml
	kda sign $< -k ${KEYS_DIR}/ns.yaml

json: tx-bro-dex-core-${PAIR}.json tx-bro-dex-view-${PAIR}.json tx-bro-dex-wrapper-${PAIR}.json tx-rb-tree.json tx-init.json

yaml: tx-bro-dex-core-${PAIR}.yaml tx-bro-dex-view-${PAIR}.yaml tx-bro-dex-wrapper-${PAIR}.yaml tx-rb-tree.yaml tx-init.yaml

all: yaml

clean:
	rm -rf .pact
	rm -f tx*.yaml
	rm -f tx*.json
	rm -rf ${_DATA_FILE}
