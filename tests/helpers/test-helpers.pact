(module test-helpers G
  (use bro-dex-core-KDA-ABC)
  (use bro-dex-view-KDA-ABC)
  (use free.util-strings)

  (defcap G ()
    (enforce false "No"))

  (defun format-id (id:integer)
    (let ((_id (to-string id)))
      (+ (concat (make-list (- 22 (length _id)) "0")) _id))
  )

  (defun format-order:string (order:object:{order})
    (bind order {'id:=id, 'is-ask:=is-ask, 'amount:=amount, 'price:=price, 'partial:=partial}
      (format "{} {} / {} - {}{}" [(if is-ask "--->" "<---"), (format-id id), amount, price, (if partial " (P)" "")]))
  )

  (defun format-title:string (x:string)
    (+ (concat (make-list (/ (- 50 (length x)) 2) "-"))
       (+ x
          (concat (make-list (/ (- 50 (length x)) 2) "-"))))
  )

  (defun format-all-orders:string ()
    (join "\n" (+ [(format-title "ORDER-BOOK")]
                  (map (format-order) (get-orderbook NIL 50))))
  )

  (defun all-orders-for:string (account:string)
    (join "\n" (+ [(format-title (+ "HISTORY FOR " account))]
                  (map (format-order) (get-orders-by-maker account NIL 50))))
  )


  (defun format-orders-history:string ()
    (join "\n" (+ [(format-title "HISTORY")]
                  (map (format-order) (get-orders-in-history NIL 50))))
  )

  (defun format-orders-history-for:string (account:string)
    (join "\n" (+ [(format-title (+ "HISTORY FOR " account))]
                  (map (format-order) (get-orders-in-account-history account NIL 50))))

  )
)
