(module bro-dex-core-PAIR GOVERNANCE
  ;SPDX-License-Identifier: BUSL-1.1
  ; => https://github.com/brothers-DAO/bro-dex/blob/main/LICENSE
  (use free.util-lists)
  (use free.util-math)

  (defcap GOVERNANCE ()
    (enforce-keyset "__NAMESPACE__.bro-dex-admin"))

  ; --------------------------- CAPABILITIES -----------------------------------
  ; ----------------------------------------------------------------------------
  (defcap MAKE-ORDER (id:integer)
    @doc "Main cap acquired when creating an order"
    @event
    (compose-capability (INSERT-ORDER id))
    (compose-capability (POINTER-SWAP))
    (compose-capability (UPDATE-TREE))
  )

  (defcap TAKE-ORDER (id:integer)
    @doc "Main cap acquired when taking an order"
    @event
    (compose-capability (REMOVE-ORDER id))
    (compose-capability (ORDER-ACCOUNT id))
    (compose-capability (POINTER-SWAP))
    (compose-capability (UPDATE-TREE))
  )

  (defcap CANCEL-ORDER (id:integer)
    @doc "Main cap acquired when cancelling an order"
    @event
    (compose-capability (REMOVE-ORDER id))
    (compose-capability (ORDER-ACCOUNT id))
    (compose-capability (POINTER-SWAP))
    (compose-capability (UPDATE-TREE))
  )

  ; These 3 caps are internals caps acquired via composability
  (defcap POINTER-SWAP ()
    true)

  (defcap REMOVE-ORDER (id:integer)
    true)

  (defcap INSERT-ORDER (id:integer)
    true)

  (defcap ORDER-ACCOUNT (id:integer)
    true)

  (defcap UPDATE-TREE ()
    true)

  ; --------------------------- ORDERS MANAGEMENT ------------------------------
  ; ----------------------------------------------------------------------------
  (defconst STATE-DUMMY 0) ; Dummy orders (only for technical reasons)
  (defconst STATE-ACTIVE 1) ; Order is active and ready to be taken
  (defconst STATE-CANCELED 3) ; Order has been canceled
  (defconst STATE-TAKEN 4) ; Order has been taken

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

  (defun fail:bool ()
    (enforce false "False"))

  (defconst DEFAULT-GUARD (create-user-guard (fail)))

  (defconst NIL-ORDER {'id:NIL, 'is-ask:false, 'state:STATE-DUMMY, 'partial:false,
                       'm-p:NIL, 'm-n:NIL,
                       'h-m-n:NIL, 'h-t-n:NIL, 'h-n:NIL,
                       'price:0.0, 'amount:0.0, 'maker-acct: "",
                       'guard: DEFAULT-GUARD})

  (deftable order-table:{order-sch})

  (defconst NIL 0)
  (defconst ASK_TREE (+ "PAIR" "_ask"))
  (defconst BID_TREE (+ "PAIR" "_bid"))

  (defun get-tree:string (is-ask:bool)
    (if is-ask ASK_TREE BID_TREE))


  (defun get-order:object{order-sch} (id:integer)
    (read order-table (key id)))

  ; ---------------------- POINTERS MANAGEMENT ---------------------------------
  ; ----------------------------------------------------------------------------
  (defschema pointer-sch
    pt:integer
  )

  (deftable pointer-table:{pointer-sch})

  (defun swap-ptr:integer (pointer-name:string new-head:integer)
    @doc "Update a pointer + returns the previous pointer"
    (require-capability (POINTER-SWAP))
    (with-default-read pointer-table pointer-name {'pt:NIL} {'pt:=head}
      (write pointer-table pointer-name {'pt:new-head})
      head)
  )

  ; Pointer to the maker's linked list
  (defun maker-head:string (account:string)
    (hash ["M", account]))

  ; Pointer to account history linked list
  (defun account-history-head:string (account:string)
    (hash ["H", account]))

  ; Pointer to the first ask
  (defconst ASKS "A")

  ; Pointer to the first global history order
  (defconst GLOBAL-HISTORY "G")

  (defun pointed:object{order-sch} (pointer-name:string)
    (with-default-read pointer-table pointer-name {'pt:NIL} {'pt:=ptr}
      (get-order ptr)))

  (defun pointer:integer (pointer-name:string)
    (with-default-read pointer-table pointer-name {'pt:NIL} {'pt:=ptr}
      ptr))

  ; ---------------------- IDS MANAGEMENT --------------------------------------
  ; ----------------------------------------------------------------------------
  (defschema seed-sch
    last-id:integer)

  (deftable seed-table:{seed-sch})

  (defun next-id:integer ()
    @doc "Returns the next ID to be used (Read only function)"
    (with-read seed-table "" {'last-id:=last}
      (str-to-int 64 (take 12 (hash last))))
  )

  (defun gen-id:integer ()
    @doc "Gives the next ID, and update the seed"
    (let ((new-id (next-id)))
      (update seed-table "" {'last-id:new-id})
      new-id)
  )

  (defun key:string (x:integer)
    (int-to-str 64 x))

  (defconst MAX-ID (^ 2 72))

  ; -------------------------- ORDER'S ACCOUNTS --------------------------------
  ; ----------------------------------------------------------------------------
  ; Each order has its own account
  (defun order-account-guard:guard (id:integer)
    (create-capability-guard (ORDER-ACCOUNT id)))

  (defun order-account:string (id:integer)
    (create-principal (order-account-guard id)))

  (defconst FEE-ACCOUNT "__FEE_ACOUNT__")

  ; -----------------FINANCIAL RELATED FUNCTIONS -------------------------------
  ; ----------------------------------------------------------------------------
  (defconst MIN-PRICE 0.0)
  (defconst MAX-PRICE 1000000000000.0)
  (defconst MIN-AMOUNT __MIN_AMOUNT__)
  (defconst MAX-AMOUNT 100.0)

  (defconst FEE-RATIO 0.001)

  ; We have here some useful functions to compute amounts
  (defun total-quote:decimal (price:decimal amount:decimal)
    @doc "Compute the raw price in QUOTE to pay"
    (floor (* price amount) (__QUOTE_MOD__.precision)))

  (defun total-quote-fee:decimal (price:decimal amount:decimal)
    @doc "Compute the fees in QUOTE for a given amount and price"
    (floor (prod3 FEE-RATIO price amount) (__QUOTE_MOD__.precision)))

  (defun base-fee:decimal (amount:decimal)
    @doc "Compute the fee in BASE for a given amount"
    (floor (* FEE-RATIO amount) (__BASE_MOD__.precision)))

  (defun base-with-fee:decimal (amount:decimal)
    @doc "Compute the total price n BASE with fee"
    (floor (* (+ 1.0 FEE-RATIO) amount) (__BASE_MOD__.precision)))

  (defun total-quote-with-fee:decimal (price:decimal amount:decimal)
    @doc "Compute the total price in QUOTE to pay including fees"
    (floor (prod3 (+ 1.0 FEE-RATIO) price amount) (__QUOTE_MOD__.precision)))

  (defun enforce-order-account-min-balance:bool (id:integer token:module{fungible-v2} min-balance:decimal)
    @doc "Check that an accounts is properly funded"
    (let ((bal (try 0.0 (token::get-balance (order-account id)))))
      (enforce (>= bal min-balance) "Order account not funded"))
  )

  (defun primary-currency:module{fungible-v2} (is-ask:bool)
    (if is-ask __BASE_MOD__ __QUOTE_MOD__))

  (defun secondary-currency:module{fungible-v2} (is-ask:bool)
    (if is-ask __QUOTE_MOD__ __BASE_MOD__))

  (defun --transfer-from-order (id:integer currency:module{fungible-v2} dst:string amount:decimal)
    @doc "Transfer an amount from an order account, with a given currency"
    (require-capability (ORDER-ACCOUNT id))
    (install-capability (currency::TRANSFER (order-account id) dst amount))
    (currency::transfer (order-account id) dst amount))

  ; -------------------------- UTIL FUNCTIONS ----------------------------------
  ; ----------------------------------------------------------------------------
  ; Some util functions to navigate through linked list.
  (defun next-order:object{order-sch} (in:object{order-sch})
    (get-order (at 'id (rb-tree.next-node (get-tree (at 'is-ask in))))))

  (defun prev-order:object{order-sch} (in:object{order-sch})
    (get-order (at 'id (rb-tree.prev-node (get-tree (at 'is-ask in))))))

  (defun next-order-by-maker:object{order-sch} (in:object{order-sch})
    (get-order (at 'm-n in)))

  (defun next-order-in-account-history:object{order-sch} (in:object{order-sch} account:string)
    (bind in {'h-m-n:=by-maker, 'h-t-n:=by-taker, 'maker-acct:=maker}
      (get-order (if (= maker account) by-maker by-taker))))

  (defun next-order-in-history:object{order-sch} (in:object{order-sch})
    (get-order (at 'h-n in)))

  ; -------------------------- INIT FUNCTION -----------------------------------
  ; ----------------------------------------------------------------------------
  (defun init:bool ()
    @doc "Init the module"
    (insert seed-table "" {'last-id: (str-to-int 64 (tx-hash))})
    (insert order-table (key 0) NIL-ORDER)
    (insert order-table (hash ASK_TREE) NIL-ORDER)
    (insert order-table (hash BID_TREE) NIL-ORDER)
    (rb-tree.init-tree ASK_TREE (create-capability-guard (UPDATE-TREE)) MAX-PRICE)
    (rb-tree.init-tree BID_TREE (create-capability-guard (UPDATE-TREE)) 0.0)
    ; Check that the fee account exists
    (__BASE_MOD__.get-balance FEE-ACCOUNT)
    (__BASE_MOD__.get-balance FEE-ACCOUNT)
    true
  )

  ; -------------------------------- LAYER 1 -----------------------------------
  ; ----------------------------------------------------------------------------
  ; Low level routines: insert and removes orders
  (defun insert-order:string (order:object{order-sch})
    @doc "Low level function for inserting a new order. Updates Orderbook and Maker's linked lists"
    (bind order {'id:=id, 'price:=price, 'maker-acct:=maker, 'is-ask:=cur-is-ask}
      (require-capability (INSERT-ORDER id))
        (let ((last-first-maker (swap-ptr (maker-head maker) id)))
          (rb-tree.insert-value (if cur-is-ask ASK_TREE BID_TREE) (key id)  (if cur-is-ask price (- price)))
          (insert order-table (key id) (+ {'state:STATE-ACTIVE, 'm-p:NIL, 'm-n:last-first-maker} order))
          ; Maker's linked list => Push on head
          (update order-table (key last-first-maker) {'m-p:id})

        ))
  )


  (defun remove-order:string (order:object{order-sch})
    @doc "Low level function for removing an order. Updates Orderbook and Maker's linked lists"
    (bind order {'id:=id, 'm-p:=maker-prev, 'm-n:=maker-next, 'is-ask:=is-ask, 'maker-acct:=maker}
      (require-capability (REMOVE-ORDER id))
      (rb-tree.delete-value (key id))

      ; Update the previous in the Maker's linked list
      (if (!= maker-prev NIL)
          (update order-table (key maker-prev) {'m-n:maker-next})
          (swap-ptr (maker-head maker) maker-next))

      ; Update the next in the Maker's linked list
      (if (!= maker-next NIL)
          (update order-table (key maker-next) {'m-p:maker-prev})
          "")

      ; Update the order itself by blanking its pointers
      (update order-table (key id) (+ {'m-p:NIL, 'm-n:NIL} order)))
  )

  ; -------------------------------- LAYER 2 -----------------------------------
  ; ----------------------------------------------------------------------------
  ; Order removal routines: manages histories
  (defun take-order-full:decimal (order:object{order-sch} taker:string)
    @doc "Low level function for taking an order in Full. Update history"
    (bind order {'maker-acct:=maker, 'id:=id, 'amount:=amount}
      (require-capability (TAKE-ORDER id))
        ; Taking the order in full means = Removing it from the orderbook, and updatinf history's linked lists
      (remove-order (+ {'h-m-n: (swap-ptr (account-history-head maker) id), ; Push to maker history
                        'h-t-n: (swap-ptr (account-history-head taker) id), ; Push to taker history
                        'h-n: (swap-ptr GLOBAL-HISTORY id), ;Push to main history
                        'state:STATE-TAKEN} order))
      amount)
  )

  (defun take-order-partial:decimal (order:object{order-sch} taker:string amount:decimal)
    @doc "Low level function for takinga partial order, appends a dummy order in history and update amounts"
    (bind order {'id:=id, 'amount:=prev-amount, 'maker-acct:=maker}
      (require-capability (TAKE-ORDER id))
      (update order-table (key id) {'amount:(- prev-amount amount), 'partial:true})

      (let ((dummy-id (gen-id)))
        (insert order-table (key dummy-id) (+ {'id:dummy-id, 'amount:amount, 'partial:true, 'state: STATE-TAKEN,
                                               'h-m-n: (swap-ptr (account-history-head maker) dummy-id),
                                               'h-t-n: (swap-ptr (account-history-head taker) dummy-id),
                                               'h-n: (swap-ptr GLOBAL-HISTORY dummy-id)} order)))
      amount)
  )

  (defun --cancel-order:bool (order:object{order-sch})
    (bind order {'id:=id, 'guard:=order-guard, 'maker-acct:=maker}
      (require-capability (CANCEL-ORDER id))
      (enforce-guard order-guard)
      (remove-order (+ {'state:STATE-CANCELED,
                        'h-m-n: (swap-ptr (account-history-head maker) id)} order)))
    true
  )

  ; ---------------------- LAYER 3 : PUBLIC TRANSACTIONS FUNCTIONS--------------
  ; ----------------------------------------------------------------------------
  ; On top of layers 1/2 : manages payments data
  (defun take-order:decimal (id:integer taker:string amount:decimal)
    @doc "Main function for taking an order"
    (let ((order (get-order id)))
      (bind order {'amount:=order-amount, 'price:=price, 'maker-acct:=maker, 'state:=state, 'is-ask:=is-ask}
        (enforce (= state STATE-ACTIVE) "Order not in active state")
        (with-capability (TAKE-ORDER id)
          ; 1 Take care of the taker
          (--transfer-from-order id (primary-currency is-ask) taker (if is-ask amount (total-quote price amount)))
          ; 2 Take care of the maker
          (--transfer-from-order id (secondary-currency is-ask) maker (if is-ask (total-quote price amount) amount))
          ; 3 Pay the fees
          (--transfer-from-order id (secondary-currency is-ask) FEE-ACCOUNT (if is-ask (total-quote-fee price amount) (base-fee amount)))
          ; 4 Process the order
          (if (< amount order-amount)
              (take-order-partial order taker amount) ; => Partial
              (take-order-full order taker))))) ; => Or full
  )

  (defun cancel-order:bool (id:integer)
    @doc "Main function for cancelling an order"
    (let ((order (get-order id)))
      (bind order {'amount:=amount, 'state:=state, 'price:=price, 'maker-acct:=maker, 'guard:=guard, 'is-ask:=is-ask}
        (enforce (= state STATE-ACTIVE) "Order not in active state")
        (with-capability (CANCEL-ORDER id)
          (enforce-guard guard)
          (let ((currency:module{fungible-v2} (primary-currency is-ask))
                (total-amount (if is-ask amount (total-quote price amount))))

            (install-capability (currency::TRANSFER (order-account id) maker total-amount))
            (currency::transfer  (order-account id) maker total-amount))
          (--cancel-order order))))
  )

  (defun create-order:integer (is-ask:bool maker:string maker-guard:guard amount:decimal price:decimal)
    @doc "Main function for creating a new order"
    (let ((id (gen-id)))
      (enforce-order-account-min-balance id (primary-currency is-ask)
                                            (if is-ask amount (total-quote price amount)))
      (enforce (and? (between MIN-PRICE MAX-PRICE) (< 0.0 ) price) "Price out of bounds")
      (enforce (between MIN-AMOUNT MAX-AMOUNT amount) "Amount out of bounds")
      (with-capability (MAKE-ORDER id)
        (insert-order (+ {'id:id, 'state:STATE-ACTIVE, 'is-ask:is-ask,
                          'price:price, 'amount:amount, 'maker-acct:maker, 'guard:maker-guard} NIL-ORDER)))
      id)
  )

)
