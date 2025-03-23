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

## Makefile

**Check variables:**
  - ``PAIR`` = Deployed modules basename
  - ``NS = Namespace
  - ``INIT`` = Let uncommented if the init code must be included => First deployment of a pair only
  - ``KEYS_DIR``
  - ``DATA_FILE``

**M4 Macros:**
  - ``__NAMESPACE__`` : Leave untouched
  - ``PAIR``: Leave untouched
  - ``__QUOTE_MOD__``: Quote module
  - ``__BASE_MOD__``: Base module
  - ``__MIN_AMOUNT__``: Min amount in Base
  - ``__MIN_PRICE__``: Min price in Base / Quote
  - ``__DECIMAL__``: Decimals of the Quantum
  - ``__FEE_ACCOUNT__``: Where the fees goes

## Gen transactions

Generate unsigned transactions
```sh
make yaml
```

Generate signed transactions
```sh
make json
```

## Transactions files

### tx-init.json

Init the namespace and the keysets. To be run once for the whole system

### tx-rb-tree.json

Deploy the Red-Black tree module. To be run once for the whole system

### tx-bro-dex-xxx-PAIR.json

Where xxx in [``core``, ``view``, ``wrapper``]. Core must be deployed first, then View and Wrapper
