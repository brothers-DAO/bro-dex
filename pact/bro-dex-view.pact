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

  (defun next-order-by-id:object{order-sch} (id:integer)
    @doc "An util function to return the following order in Orderbook by ID"
    (next-order (get-order id)))

  (defun --is-valid:bool (x:object:{order})
    @doc "True if the order is valid"
    (!= STATE-DUMMY (at 'state x)))

  (defun --append-valid-order:[object:{order}] (input:[object:{order}] x:object:{order})
    @doc "Appends an order to an existing list only if the order is valid"
    (if (--is-valid x) (append-last input x) input))

  (defun is-nil:bool (x:integer)
    @doc "True if x is NIL"
    (= NIL x))

  (defun is-not-nil:bool (x:integer)
    @doc "True if x is not nill"
    (!= NIL x))

  (defun --append-next-order-in-history:[object:{order}] (input:[object:{order}] _:integer)
    @doc "Appends next order from global history to an existing list"
    (--append-valid-order input (next-order-in-history (last input))))

  (defun --append-next-order-in-account-history:[object:{order}] (account:string input:[object:{order}] _:integer)
    @doc "Appends next order from account's history to an existing list"
    (--append-valid-order input (next-order-in-account-history (last input) account)))

  (defun --append-next-order-by-maker:[object:{order}] (input:[object:{order}] _:integer)
    @doc "Appends next order from Maker linked list to an existing list"
    (--append-valid-order input (next-order-by-maker (last input))))

  (defun --append-next-node:[object{node-sch}] (input:[object{node-sch}] _:integer)
    (let ((nn (next-node (last input))))
      (if (is-base nn)
          input
          (append-last input nn)))
  )

  (defun get-orderbook:[object{order-sch}] (is-ask:bool from:integer max-count:integer)
    @doc "Returns max-count element from a specific point in Orderbook \
       \  Starts from the first element if from is NIL"
    (let ((first-n (if (is-not-nil from)
                       (get-node (key from))
                       (first-node (get-tree is-ask)))))
      (if (is-base first-n)
          []
          (map (compose (compose (at 'id) (from-key)) (get-order))
               (fold (--append-next-node) [first-n] (enumerate 1 max-count)))))
  )

  (defun get-orders-by-maker:[object{order-sch}] (account:string from:integer max-count:integer)
    @doc "Returns max-count element from a specific point in Maker's list \
       \  Starts from the first element if from is NIL"
    (cond
      ( (is-not-nil from)
          (fold (--append-next-order-by-maker) [(get-order from)] (enumerate 1 max-count)))
      ( (is-not-nil (pointer (maker-head account)))
          (fold (--append-next-order-by-maker) [(pointed (maker-head account))] (enumerate 1 max-count)))
      [])
  )

  (defun get-orders-in-history:[object{order-sch}] (from:integer max-count:integer)
    @doc "Returns max-count element from a specific point in Global history \
       \  Starts from the first element if from is NIL"
    (cond
      ( (is-not-nil from)
          (fold (--append-next-order-in-history) [(get-order from)] (enumerate 1 max-count)))
      ( (is-not-nil (pointer GLOBAL-HISTORY))
          (fold (--append-next-order-in-history) [(pointed GLOBAL-HISTORY)] (enumerate 1 max-count)))
      [])
  )

  (defun get-orders-in-account-history:[object{order-sch}] (account:string from:integer max-count:integer)
    @doc "Returns max-count element from a specific point in account's history \
         \  Starts from the first element if from is NIL"
    (cond
      ( (is-not-nil from)
          (fold (--append-next-order-in-account-history account) [(get-order from)] (enumerate 1 max-count)))
      ( (is-not-nil (pointer (account-history-head account)))
          (fold (--append-next-order-in-account-history account) [(pointed (account-history-head account))] (enumerate 1 max-count)))
      [])
  )

  (defun first-ask:object{order-sch} ()
    @doc "Returns the lowest price Ask"
    (get-order (from-key (rb-tree.first-value ASK_TREE))))

  (defun first-bid:object{order-sch}()
    @doc "Returns the highests price Bid"
    (get-order (from-key (rb-tree.first-value BID_TREE))))
)
