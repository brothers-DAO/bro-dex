#PAIR=BRO-KDA-R
PAIR=BRO-ABC-R
NS=n_966932c40a83cebb2fb0aece0d80c5155e148778

#Comment to disable Init
INIT= -D__INIT__

# Dont forget to set the pair modules here
MACROS= -D__NAMESPACE__=${NS} \
        -DPAIR=${PAIR} \
        -D__QUOTE_MOD__=n_ff0f76ee90735fba124eba93a1c49423c75654b1.abc \
        -D__BASE_MOD__=n_5d119cc07ffd5efaef5c7feef9e878f34e3d4652.bro \
        -D__MIN_AMOUNT__=0.001 \
        -D__MIN_PRICE__=1.0 \
				-D__DECIMALS__=6 \
        -D__FEE_ACOUNT__=r:${NS}.fees \
        -DRB_TREE_NS=${NS} \

DATA_FILE=testnet.yaml

_DATA_FILE = $(basename ${DATA_FILE})_${PAIR}.yaml

.SECONDARY:

.pact:
	mkdir -p .pact

${_DATA_FILE}: ${DATA_FILE}
	m4 ${MACROS} $< > $@

.pact/rb-tree.pact: templates/rb-tree.pact.m4 ../pact_RB_tree/pact/rb-tree.pact | .pact

.pact/%-${PAIR}.pact: templates/%.pact.m4 ../pact/%.pact | .pact
	m4 ${MACROS} ${INIT} $< > $@

tx-%-${PAIR}.yaml: templates/%.tkpl .pact/%-${PAIR}.pact ${_DATA_FILE}
	kda gen -t $< -o $@ -d ${_DATA_FILE}

tx-%.yaml: templates/%.tkpl .pact/%.pact ${_DATA_FILE}
	kda gen -t $< -o $@ -d ${_DATA_FILE}

tx-init.yaml: templates/init.tkpl ${_DATA_FILE}
	kda gen -t $< -o $@ -d ${_DATA_FILE}

%.json: %.yaml
	kda sign $< -k keys/testnet/gas.key
	kda sign $< -k keys/testnet/admin.key
	kda sign $< -k keys/testnet/ns.key

json: tx-bro-dex-core-${PAIR}.json tx-bro-dex-view-${PAIR}.json tx-bro-dex-wrapper-${PAIR}.json tx-rb-tree.json tx-init.json

yaml: tx-bro-dex-core-${PAIR}.yaml tx-bro-dex-view-${PAIR}.yaml tx-bro-dex-wrapper-${PAIR}.yaml tx-rb-tree.yaml tx-init.yaml

all: yaml

clean:
	rm -rf .pact
	rm -f tx*.yaml
	rm -f tx*.json
	rm -rf ${_DATA_FILE}
