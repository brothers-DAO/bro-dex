PAIR=BRO-KDA
NS=n_966932c40a83cebb2fb0aece0d80c5155e148778

#Comment to disable Init
INIT= -D__INIT__

MACROS=-D__NAMESPACE__=${NS} -DPAIR=${PAIR} -D__QUOTE_MOD__=coin -D__BASE_MOD__=n_5d119cc07ffd5efaef5c7feef9e878f34e3d4652.bro -D__MIN_AMOUNT__=0.001 -D__FEE_ACOUNT__=r:${NS}.fees 
DATA_FILE=testnet.yaml

.SECONDARY:

.pact:
	mkdir -p .pact

.pact/%-${PAIR}.pact: templates/%.pact.m4 ../pact/%.pact | .pact
	m4 ${MACROS} ${INIT} $< > $@

tx-%-${PAIR}.yaml: templates/%.tkpl .pact/%-${PAIR}.pact
	kda gen -t $< -o $@ -d ${DATA_FILE}

tx-init.yaml: templates/init.tkpl
	kda gen -t $< -o $@ -d ${DATA_FILE}

%.json: %.yaml
	kda sign $< -k keys/testnet/gas.key
	kda sign $< -k keys/testnet/admin.key
	kda sign $< -k keys/testnet/ns.key

json: tx-bro-dex-core-${PAIR}.json tx-bro-dex-view-${PAIR}.json tx-bro-dex-wrapper-${PAIR}.json tx-init.json

yaml: tx-bro-dex-core-${PAIR}.yaml tx-bro-dex-view-${PAIR}.yaml tx-bro-dex-wrapper-${PAIR}.yaml tx-init.yaml


all: yaml

clean:
	rm -rf .pact
	rm -f tx*.yaml
	rm -f tx*.json
