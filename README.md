# BRO DEX = First 100% decentralized Order's based DEX on Kadena

## Pairs and Modules
Each pair requires the deployment of 3 linked module:
  - core
  - view
  - wrapper

#### Assumptions
The pair has a `__BASE_MOD__` parameter, which is the bought currency.
The pair has a `__QUOTE_MOD__` parameter, which is the current used to buy `__BASE_MOD__`.


#### Modules generation
Modules composing a pairs can be generated using M4 macros.

### Modules Overview

#### `core` module

This is the main modules which handles orders and guarantee the security of the orders and associated funds. It manages all linked lists, and states of the pairs.

However, this module is not intended to be called directly from the end-user. There are risks of loss of funds, and failed transactions. This module should be called by helpers modules: `wrapper` and `view` or by optimized bots whose creator understands the pitfalls to avoid.

### `view` module

Module linked to the `core` module, which provides helpers functions to retrieve and view the state of the pair.

### `wrapper` module

Module intended to be used by end-user or frontends. It provides high level functions, like GTC, FOK, IOC, Post-Only. It manages properly the risks, and the

![Bro DEX Overview](/docs/bro-dex-overview.svg)


## Core module

#### Orders object

#### Orders ID's

#### Order's specific accounts


#### Layers

#### Linked lists and pointers table

![Bro DEX Overview](/docs/bro-dex-linked-list.svg)

#### External API


## View module

#### External API


## Wrapper module

#### External API

#### Hints mmanagement
