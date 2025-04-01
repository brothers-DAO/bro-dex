# BRO DEX = First 100% decentralized Order's based DEX on Kadena


## License
 - Pact modules (pact directory) are released under "Business Source License 1.1"
 - Test and Deployement scripts (tests and deployment directories) released under "Modified BSD License"
 - Frontend is released under "Modified BSD License"

## Deployment

### mainnet01 / chain 2


#### Frontend
https://dex.bro.pink

#### Namespace

``n_f6aa9328b19b8bf7e788603bd669dcf549e07575``

#### Pairs
**$BRO / KDA:**
  - Core: ``n_f6aa9328b19b8bf7e788603bd669dcf549e07575.bro-dex-core-BRO-KDA-M``
  - View: ``n_f6aa9328b19b8bf7e788603bd669dcf549e07575.bro-dex-view-BRO-KDA-M``
  - Wrapper: ``n_f6aa9328b19b8bf7e788603bd669dcf549e07575.bro-dex-wrapper-BRO-KDA-M``
  - Wrapper deposit account: ``c:d4JKSygtIEXiObK0Q7rrn78O4yIp9lQYxDoFIXV7b3o``


**$BRO / zUSD:**
  - Core: ``n_f6aa9328b19b8bf7e788603bd669dcf549e07575.bro-dex-core-BRO-zUSD-M``
  - View: ``n_f6aa9328b19b8bf7e788603bd669dcf549e07575.bro-dex-view-BRO-zUSD-M``
  - Wrapper: ``n_f6aa9328b19b8bf7e788603bd669dcf549e07575.bro-dex-wrapper-BRO-zUSD-M``
  - Wrapper deposit account: ``c:jDTPscjEcdDjRMIPinQfgpwBBBlKaDoNd-f90xvqUB8``

**$BRO / HERON:**
  - Core: ``n_f6aa9328b19b8bf7e788603bd669dcf549e07575.bro-dex-core-BRO-HERON-M``
  - View: ``n_f6aa9328b19b8bf7e788603bd669dcf549e07575.bro-dex-view-BRO-HERON-M``
  - Wrapper: ``n_f6aa9328b19b8bf7e788603bd669dcf549e07575.bro-dex-wrapper-BRO-HERON-M``
  - Wrapper deposit account: ``c:mkyNffpMpr9v8szdrAsn-fFK20NTuR-KwwNozenj134``

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

Module intended to be used by end-user or frontends. It provides high level functions, like GTC, FOK, IOC, Post-Only. It schedules and organizes "core calls" according to the user's choices and limits (Order type, Price). It guarantees that the best possible choice are done at "mining time".

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
    h-t-n:integer ; Next in the history list of the taker
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
- Orderbook Bids: Red-Black Tree
- Orderbook Asks: Red-Black Tree
- Maker active Orders: Double linked list
- User History: Single linked list
- Global history: Single linked list

![Bro DEX Linked Lists](/docs/bro-dex-data-structures.svg)

### DoS and minimum amounts/prices considerations

#### Prevent "cheap orders"
An attacker could submit thousands of very cheap orders, making it mandatory for takers to spend a lot of gas (in the worst case, more than transferred value) for using the DEX.
To prevent this, each pair has a `MIN-AMOUNT` constant which applies for each order creation.

#### Prevent 0-value transfers
An attacker could take partially an order and let minimal remaining, which could lead to 0-value transfers (especially on the fee part), and stuck the DEX.
To prevent this, taking operations are allowed only to transact amounts in multiples of `QUANTUM-AMOUNT` defined by the constant `DECIMALS`, and `MIN-PRICE` applies for each order creation.

The equations must hold for all deployed DEX modules:
- `QUANTUM-AMOUNT` = 10 ^ -`DECIMALS`
- `MIN-AMOUNT` >= `QUANTUM-AMOUNT` and `MIN-AMOUNT` is a multiple of `QUANTUM-AMOUNT`
- `QUANTUM-AMOUNT` * `MIN-PRICE` >= minimum transferable amount of the base token (usually 1e-12)
- `MIN-AMOUNT` * `MIN-PRICE` * `FEE-RATIO` >= minimum transferable amount for the quote token (usually 1e-12)





#### External API

##### Read-Only and util functions

See comments in the source code in sections: `FINANCIAL RELATED FUNCTIONS` and `UTIL FUNCTIONS`.


##### `(first-ask)`
→ *[object{order-sch}]*
Return the first ask in Orderbook.

##### `(first-bid)`
→ *[object{order-sch}]*
Return the first bid in Orderbook.

#### Transaction functions

##### `(create-order)`
`is-ask` *bool* `maker` *string* `maker-guard` *guard* `amount` *decimal* `price` *decimal* `prev` *integer* → *integer*

This function creates a new order for a given `amount` (in BASE), at a given `price` (in QUOTE). Depending on `is-ask`, it can be an Ask order or a Bid order.

`maker` is the account to be paid when the order is taken.
`maker-guard` protects the order for cancellation.
`prev` is the previous order in the Orderbook linked-list. It must be exact and computed before, otherwise the transaction will fail.

**Important note**: The `amount` in case of an Ask, or the product `amount` x `price` (can be computed with `(total-quote)`) in case of a Bid must have been previously transferred to the Order's specific account (can be computed by `(order-account (next-id))`).

**Account prerequisites**: The `maker` account must already exist in both currencies (base and quote), otherwise the function will fail.

Returns the OrderID.

##### `(take-order)`
`id` *integer* `taker` *string*  `amount` *decimal* → *decimal*

Take an order `id`.
`taker` is the account to pay the order value.
`amount` must be equal or less than the order's amount. When it's "less", it will result in a "partial take".

**Important note**: The `amount` + *Fees* (can be computed with `(base-with-fee)`) in case of taking a Bid, or the `amount` x `price` + *Fees* (can be computed with `(total-quote-with-fee)`) in case of taking an Ask must have been previously transferred to the the Order's specific account (can be computed by `(order-account id)`).

**Account prerequisite**: The `taker` account is expected to exist in the target currency. The core module won't create it.

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



## Wrapper module

This module is supposed to be used by Frontends and other clients. It hides the complexity of the core module and allows doing multiple operations at once, eg:
  - Taking several orders that meet a limit criterion.
  - Taking orders + Submitting a Maker order.

#### Deposit account

The module works by using a `DEPOSIT-ACCOUNT` with an associated `DEPOSIT-ACCOUNT-GUARD`. The caller is supposed to have pre-installed the `TRANSFER ` capability with the right amount (with fees included) before calling functions.

If some part of the transaction amount (or fees) remains unused, it will be automatically refunded back to the source account.

Special functions from the core modules can be used to compute amounts.

#### Order types

The module manages 4 order types:
  - **GTC**: Good Till Canceled => This flavor attempts to take 10 existing active offers (Taker) at most and creates a Maker order with the remaining amount if possible.
  - **IOC**: Immediate Or Cancel => This flavor attempts to take 10 existing active offers (Taker) at most and creates a Maker order with the remaining amount if possible.
  - **FOK**: Fill Or Kill => This flavor attempts to take 10 existing active offers (Taker) at most, but reverts the transaction if the order is not fully filled.
  - **Post-Only**: Create a Maker order only if possible.

#### External API

##### buy-ioc / buy-gtc / buy-fok / buy-post-only
`account` *string* `account-guard` *guard* `amount` *decimal* `limit` *decimal* → `string`

Buy (IOC / GTC  / FOK or Post-Only) a given `amount` of BASE at a maximum of `limit` price.

The caller must install (eventually through a restricted signature) the cap:
`(QUOTE.TRANSFER account DEPOSIT-ACCOUNT quote-amount)`

where:
- `quote-amount` =  amount * limit * (1.0 + FEE). In case of IOC, GTC or FOK. Can be computed with the function: `(total-quote-with-fee)`

- `quote-amount` =  amount * limit. In case of Post-Only. Can be computed with the function: `(total-quote)`

##### sell-ioc / sell-gtc / sell-fok / sell-post-only
`account` *string* `account-guard` *guard* `amount` *decimal* `limit` *decimal* → `string`

Sell (IOC / GTC or FOK) a given `amount` of BASE at a minimum of `limit` price.

The caller must install (eventually through a restricted signature) the cap:
`(BASE.TRANSFER account DEPOSIT-ACCOUNT base-amount)`

where:
- `base-amount` =  amount * (1.0 + FEE). In case of IOC, GTC or FOK. Can be computed with the function: `(base-with-fee)`
- `base-amount` =  amount. In case of Post-Only

##### Common API notes
In the wrapper, `account-guard` will be used for 2 purposes:
  - If an order is created (not in IOC or FOK), guard the order for cancellation.
  - Create destination accounts, if one of them doesn't exist.

Functions will always return "DEX Order successful", or fail. In the case of an IOC only, the transactions may be successful even if no trading happened.  
