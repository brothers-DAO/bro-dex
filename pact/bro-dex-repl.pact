(module bro-dex-repl-PAIR G
  @doc "BRO DEX utils for being used in REPL"
  ;SPDX-License-Identifier: BUSL-1.1
  ; => https://github.com/brothers-DAO/bro-dex/blob/main/LICENSE
  (use bro-dex-core-PAIR)
  (use bro-dex-view-PAIR)
  (use free.util-strings)
  (use free.util-lists)

  (defcap G ()
    (enforce false "No"))

  (defconst ORDERS-COUNT 50)

  (defun format-id (id:integer)
    (let ((_id (to-string id)))
      (+ (concat (make-list (- 22 (length _id)) "0")) _id))
  )

  (defun format-order:string (order:object{order-sch})
    @doc "Format (to pretty string) an order object"
    (bind order {'id:=id, 'is-ask:=is-ask, 'amount:=amount, 'price:=price, 'partial:=partial}
      (format "{} {} / {} - {}{}" [(if is-ask "--A-->" "<--B--"), (format-id id), amount, price, (if partial " (P)" "")]))
  )

  (defun --format-title:string (x:string)
    (concat [(concat (make-list (/ (- 78 (length x)) 2) "-"))
             " "
             x
             " "
            (concat (make-list (/ (- 78 (length x)) 2) "-"))])
  )

  (defun format-title:string (x:string)
    @doc "Format a title"
    (--format-title (+ "PAIR / " x)))

  (defun format-all-orders:string ()
    @doc "Fetch and format all orders of the orderbook"
    (join "\n" (+ [(format-title "ORDER-BOOK")]
                  (+ (map (format-order) (reverse (get-orderbook true NIL ORDERS-COUNT)))
                     (map (format-order) (get-orderbook false NIL ORDERS-COUNT)))))
  )

  (defun all-orders-for:string (account:string)
    @doc "Fetch and format all orders belonging to an account"
    (join "\n" (+ [(format-title (+ "ACTIVE ORDERS FOR " account))]
                  (map (format-order) (get-orders-by-maker account NIL ORDERS-COUNT))))
  )


  (defun format-orders-history:string ()
    @doc "Fetch and format all orders from the global history"
    (join "\n" (+ [(format-title "HISTORY")]
                  (map (format-order) (get-orders-in-history NIL ORDERS-COUNT))))
  )

  (defun format-orders-history-for:string (account:string)
    @doc "Format the history for a given account"
    (join "\n" (+ [(format-title (+ "HISTORY FOR " account))]
                  (map (format-order) (get-orders-in-account-history account NIL ORDERS-COUNT))))
  )
)
