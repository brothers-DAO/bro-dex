# BRO-DEX Deployment scripts

## Required tools:
  - m4
  - kda tool

## Data file

Setup the deployment file

 - mainnet.yaml
 - testnet.yaml

## Keys

Verify that your keys are present in the keys/testnet or keys/mainnet.

## M4 Defintiions
Pairs are define in the defs directory.
Each defintion is a set of macros in M4.

## Gen transactions

Generate unsigned transactions
```sh
make __PAIR__
```
Where ``__PAIR__`` is a name of a defintion file.

Generate signed transactions
```sh
make PAIR-signed
```

## Transactions files

### tx-init.json

Init the namespace and the keysets. To be run once for the whole system

### tx-rb-tree.json

Deploy the Red-Black tree module. To be run once for the whole system

### tx-bro-dex-xxx-PAIR.json

Where xxx in [``core``, ``view``, ``wrapper``]. Core must be deployed first, then View and Wrapper
