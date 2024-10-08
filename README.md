# BRO DEX = First 100% decentralized Order's based DEX on Kadena

## Pairs and Modules
Each pair requires the deployment of 3 linked modules:
  - core
  - view
  - wrapper

#### Assumptions
The pair has a `__BASE_MOD__` parameter, which is the bought currency.
The pair has a `__QUOTE_MOD__` parameter, which is the current used to buy `__BASE_MOD__`.

When the order is an Ask:
  - Maker deposits `amount` BASE
  - Taker transfers `amount` x `price` QUOTE
  - Maker will receive `amount` x `price` QUOTE
  - Taker will receive `amount` BASE

When the order is a Bid:
  - Maker deposits `amount` x `price` QUOTE
  - Taker transfers `amount` BASE
  - Maker will receive `amount` BASE
  - Taker will receive `amount` x `price` QUOTE

#### Modules generation
Modules composing a pair can be generated using M4 macros.

### Fees
This DEX works with ZERO maker fees. Only the taker pays fees. The fees have to be paid using the "paying currency" by transferring a higher amount than requested by the maker.

### Modules Overview

#### `core` module

This is the main module that handles orders and guarantees the security of the orders and associated funds. It manages all linked lists, and states of the pairs.

However, this module is not intended to be called directly from the end-user. There are risks of loss of funds, and failed transactions. This module should be called by helpers modules: `wrapper` and `view` or by optimized bots whose creator understands the pitfalls to avoid.

### `view` module

Module linked to the `core` module, which provides helper functions to retrieve and view the state of the pair.

### `wrapper` module

Module intended to be used by end-user or frontends. It provides high level functions, like GTC, FOK, IOC, Post-Only. It manages properly the risks, and the

![Bro DEX Overview](/docs/bro-dex-overview.svg)



## Core module

#### Order's objects

Each order is encoded in an object stored in the `order` table:

```pact
  (defschema order-sch
    id:integer
    is-ask:bool ; Whether the order is an Ask (true) or a Bid (False)
    state:integer ; Order state
    partial:bool ; Is this a partial (split order) => This field is for info only (UX)
    m-p:integer ; Previous in the live list for a specific maker
    m-n:integer ; Next in  the live list for a specific maker
    h-m-n:integer ; Next in the history list of the maker
    h-t-n:integer ; Next in the history list of the maker
    h-n:integer ; Next in global trades history
    price:decimal ; Price in QUOTE
    amount:decimal ; Amount price in BASE
    maker-acct:string ; Maker accounts
    guard:guard ; Make guard : used for canceling the order
  )
```

**Notes about some fields:**

*state:* Possible values are:
  - `STATE-DUMMY`: Dummy orders (only for technical reasons)
  - `STATE-ACTIVE`: Order is active and ready to be taken
  - `STATE-CANCELED`: Order has been canceled
  - `STATE-TAKEN`: Order has been taken

*amount:* is always expressed in BASE currency
*price:* is always expressed in QUOTE currency

*m-p*, *m-n*, *h-m-n*, *h-t-n*, *h-n* are links to other orders and are part of the linked-list system explained below.

#### Orders ID's

Each order has a unique ID assigned: A **72 bits Integer**.

This order ID is generated by hashing the previous order ID in the `seed-table`.

This is controlled by two functions:
 - ```(gen-id)``` => Generate a new ID and update the seed
 - ```(next-id)``` => Forecast the next ID to be used by auxiliary modules. (eg: wrapper module)


#### Order's specific accounts

Each order is linked to a specific account for both currencies (BASE and QUOTE):
  - This account will store the proposed amount (in BASE in case of an Ask order, in QUOTE in case of Bid order)
  - This account will temporarily store the exchange counterpart when the order is taken. (in QUOTE when taking an Ask order, in BASE when taking a Bid order)

**The Order's specific account must be founded externally before calling external API functions of the `core` module.**

The accounts and related guards can be obtained using `(order-account)` and `(order-account-guard)`

#### Layers and module architecture

The `core` module code is organized in 3 layers.
Only functions of the Layer 3 are externally callable.

![Bro DEX Layers](/docs/bro-dex-core-layers.svg)

#### Linked lists / Self-Balanced Trees and Pointers table

The module manages several data structures for ordering orders:

Orderbook Bids: Red-Black Tree
Orderbook Asks: Red-Black Tree
Maker active Orders: Double linked list
User History: Single linked list
Global history: Single linked list


![Bro DEX Linked Lists](/docs/bro-dex-data-structures.svg)

#### External API

##### Read-Only and util functions

See comments in the source code in sections: `FINANCIAL RELATED FUNCTIONS` and `UTIL FUNCTIONS`.

#### Transaction functions

##### `(create-order)`
`is-ask` *bool* `maker` *string* `maker-guard` *guard* `amount` *decimal* `price` *decimal* `prev` *integer* → *integer*

This function creates a new order for a given `amount` (in BASE), at a given `price` (in QUOTE). Depending on `is-ask`, it can be an Ask order or a Bid order.

`maker` is the account to be paid when the order is taken.
`maker-guard` protects the order for cancellation.
`prev` is the previous order in the Orderbook linked-list. It must be exact and computed before, otherwise the transaction will fail.

**Important note**: The `amount` in case of an Ask, or the product `amount` x `price` (can be computed with `(total-quote)`) in case of a Bid must have been previously transferred to the Order's specific account (can be computed by `(order-account (next-id))`).

Returns the OrderID.

##### `(take-order)`
`id` *integer* `taker` *string*  `amount` *decimal* → *decimal*

Take an order `id`.
`taker` is the account to pay the order value.
`amount` must be equal or less than the order's amount. When it's "less", it will result in a "partial take".

**Important note**: The `amount` + *Fees* (can be computed with `(base-with-fee)`) in case of taking a Bid, or the `amount` x `price` + *Fees* (can be computed with `(total-quote-with-fee)`) in case of taking an Ask must have been previously transferred to the the Order's specific account (can be computed by `(order-account id)`).

Return the taken amount.

##### `(cancel-order)`
`id` *integer* → *bool*

Cancel an order. The transaction must be signed with the guard used during the order creation.
The signature should be scoped by the `(CANCEL-ORDER id)`.

## View module

This modules contains convenience functions to iterate through the orders lists.

Each list can be retrieved iteratively by specifying the previous (not included) orderID and the number of elements to retrieve.
Using `NIL` as first orderID retrieves the beginning of the list.

All functions return complete Order objects.

#### External API
##### `(get-orderbook)`
`is-ask` *boolean* `from` *integer* `max-count` *integer* → *[object{order-sch}]*

Return the currently active Orderbook, starting from the `from` order (or `NIL`).
If is-ask is True, return the Ask part of the orderbook, else the Bid part.

##### `(get-orders-by-maker)`
`account` *string* `from` *integer* `max-count` *integer* → *[object{order-sch}]*

Return the currently active orders (ie: to be taken) for a given account, starting from the `from` order (or `NIL`)

##### `(get-orders-in-history)`
`from` *integer* `max-count` *integer* → *[object{order-sch}]*

Return the global trading history, starting from the `from` order (or `NIL`).
Canceled orders are not present in Global history.

##### `(get-orders-in-account-history)`
`account` *string* `from` *integer* `max-count` *integer* → *[object{order-sch}]*

Return the history for a given account, starting from the `from` order (or `NIL`).
Canceled orders can be seen in account's history. Some orders may have been broken into several orders if they were partially filled.

##### `(first-ask)`
→ *[object{order-sch}]*
Return the first ask in Orderbook.

##### `(first-bid)`
→ *[object{order-sch}]*
Return the first bid in Orderbook.



## Wrapper module

#### External API
