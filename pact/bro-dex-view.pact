(module bro-dex-view-PAIR GOVERNANCE
  ;SPDX-License-Identifier: BUSL-1.1
  ; => https://github.com/brothers-DAO/bro-dex/blob/main/LICENSE
  (use free.util-lists)
  (use free.util-math)
  (use bro-dex-core-PAIR)
  (use rb-tree)

  (defcap GOVERNANCE ()
    (enforce-keyset "__NAMESPACE__.bro-dex-admin"))

  (defconst NIL bro-dex-core-PAIR.NIL)

  ; -------------------------- INTERNAL FUNCTIONS  -----------------------------
  ; ----------------------------------------------------------------------------
  (defun --is-valid:bool (x:object{order-sch})
    @doc "True if the order is valid"
    (!= STATE-DUMMY (at 'state x)))

  (defun --append-valid-order:[object:{order-sch}] (input:[object{order-sch}] x:object{order-sch})
    @doc "Appends an order to an existing list only if the order is valid"
    (if (--is-valid x) (append-last input x) input))

  (defun --node-to-order:object{order-sch} (n:object{node-sch})
    @doc "Translate an RB node to an order"
    (get-order (from-key (at 'id n))))

  (defun is-nil:bool (x:integer)
    @doc "True if x is NIL"
    (= NIL x))

  (defun is-not-nil:bool (x:integer)
    @doc "True if x is not nill"
    (!= NIL x))

  (defschema node-iterator
    p:object{node-sch}
    out:[object{order-sch}]
  )

  (defschema order-iterator
    next-id:integer
    out:[object{order-sch}]
  )

  (defun --append-next-node:object{node-iterator} (it:object{node-iterator} _:integer)
    (bind it {'p:=p, 'out:=c}
      (if (is-base p) it {'p:(next-node p),
                          'out:(append-last c (--node-to-order p))}))
  )

  (defun --initial-node:object{node-sch} (is-ask:bool from:integer)
    (if (is-nil from)
        (first-node (get-tree is-ask))
        (next-node (get-node (key from))))
  )

  (defun --append-next-order-by-maker:object{order-iterator} (it:object{order-iterator} _:integer)
    (bind it {'next-id:=n-id, 'out:=c}
      (if (is-nil n-id) it {'next-id:(at 'm-n (get-order n-id)),
                            'out:(append-last c (get-order n-id))}))
  )

  (defun --initial-maker:integer (account:string from:integer)
    (if (is-nil from)
        (pointer (maker-head account))
        (at 'm-n (get-order from)))
  )

  (defun --append-next-order-in-history:object{order-iterator} (it:object{order-iterator} _:integer)
    (bind it {'next-id:=n-id, 'out:=c}
      (if (is-nil n-id) it {'next-id:(at 'h-n (get-order n-id)),
                            'out:(append-last c (get-order n-id))}))
  )

  (defun --initial-history:integer (from:integer)
    (if (is-nil from)
        (pointer GLOBAL-HISTORY)
        (at 'h-n (get-order from)))
  )

  (defun --append-next-order-in-account-history:object{order-iterator} (account:string it:object{order-iterator} _:integer)
    @doc "Appends next order from account's history to an existing list"
    (bind it {'next-id:=n-id, 'out:=c}
      (if (is-nil n-id) it
          (let ((o (get-order n-id)))
            {'next-id:(at (if (= account (at 'maker-acct o)) "h-m-n" "h-t-n") o),
             'out:(append-last c o)})))
  )

  (defun --initial-account-history:integer (account:string from:integer)
    (if (is-nil from)
        (pointer (account-history-head account))
        (let ((o (get-order from)))
          (if (= account (at 'maker-acct o))
              (at 'h-m-n o)
              (at 'h-t-n o))))
  )

  ; -------------------------- PUBLIC FUNCTIONS  -------------------------------
  ; ----------------------------------------------------------------------------
  (defun get-orderbook:[object{order-sch}] (is-ask:bool from:integer max-count:integer)
    @doc "Returns max-count element from a specific point in Orderbook \
       \  Starts from the first element if from is NIL"
      (at 'out (fold (--append-next-node) {'p:(--initial-node is-ask from), 'out:[]}
                   (enumerate 1 (+ 0 max-count))))
  )

  (defun get-orders-by-maker:[object{order-sch}] (account:string from:integer max-count:integer)
    (at 'out (fold (--append-next-order-by-maker) {'next-id:(--initial-maker account from ), 'out:[]}
                 (enumerate 1 max-count)))
  )

  (defun get-orders-in-history:[object{order-sch}] (from:integer max-count:integer)
    @doc "Returns max-count element from a specific point in Global history \
       \  Starts from the first element if from is NIL"
    (at 'out (fold (--append-next-order-in-history) {'next-id:(--initial-history from), 'out:[]}
                 (enumerate 1 max-count)))
  )

  (defun get-orders-in-account-history:[object{order-sch}] (account:string from:integer max-count:integer)
    @doc "Returns max-count element from a specific point in account's history \
         \  Starts from the first element if from is NIL"
    (at 'out (fold (--append-next-order-in-account-history account)
                 {'next-id:(--initial-account-history account from), 'out:[]}
                 (enumerate 1 max-count)))
  )

)
