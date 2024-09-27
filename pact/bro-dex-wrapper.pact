(module bro-dex-wrapper-PAIR GOVERNANCE
  ;SPDX-License-Identifier: BUSL-1.1
  ; => https://github.com/brothers-DAO/bro-dex/blob/main/LICENSE
  (use free.util-math)
  (use bro-dex-core-PAIR)
  (use bro-dex-view-PAIR)

  (defcap GOVERNANCE ()
    (enforce-keyset "__NAMESPACE__.bro-dex-admin"))

  ; ------------------------ DEPOSIT ACCOUNT -----------------------------------
  ; ----------------------------------------------------------------------------
  (defcap DEPOSIT-ACCOUNT-CAP ()
    true)

  (defconst DEPOSIT-ACCOUNT-GUARD (create-capability-guard (DEPOSIT-ACCOUNT-CAP)))

  (defconst DEPOSIT-ACCOUNT (create-principal DEPOSIT-ACCOUNT-GUARD))

  ; ------------------------ SOME CONSTANTS  -----------------------------------
  ; ----------------------------------------------------------------------------
  ; Maximum orders taken during a single transaction
  (defconst MAX-TAKE-ORDERS 10)

  ; Expected Hint offset
  (defconst HINT-EXPECTED-OFFSET 5)

  ; Just 2 list to improve a little bit efficiency
  (defconst TAKE-ORDER-ATTEMPTS (enumerate 1 MAX-TAKE-ORDERS))

  ; ----------------- IMMEDIATE (TAKE) SALES ROUTINES --------------------------
  ; ----------------------------------------------------------------------------
  ; A small object to pass informations between immediate sales operations.
  (defschema imm-result
    rem:decimal ; Remaining amounts to sell or buy
    cnt:integer ; Number of orders taken until now
  )

  (defun --try-immediate-buy:object{imm-result} (taker:string limit:decimal iterator:object{imm-result} _:integer)
    @doc "Immediate buy iteration => Check if an order can be taken and do it if possible"
    (bind (first-ask) {'id:=id, 'amount:=amount, 'price:=price, 'state:=state}
      (bind iterator {'rem:=remaining, 'cnt:=prev-cnt}
        (if (and (and (< 0.0 remaining) ; Do we have some remaining to buy
                      (= state STATE-ACTIVE)) ;Is the ask order valid
                      (<= price limit)) ; Is the price of the ask order less than the user limit
            (with-capability (DEPOSIT-ACCOUNT-CAP)
              (install-capability (__QUOTE_MOD__.TRANSFER DEPOSIT-ACCOUNT  (order-account id) (total-quote-with-fee price (min remaining amount))))
              (__QUOTE_MOD__.transfer-create DEPOSIT-ACCOUNT (order-account id) (order-account-guard id) (total-quote-with-fee price (min remaining amount)))
              {'rem: (- remaining (take-order id taker (min remaining amount))), 'cnt:(++ prev-cnt)})
          iterator)))
  )

  (defun fold-try-immediate-buy:object{imm-result} (taker:string limit:decimal amount:decimal)
    @doc "Try to buy by taking at most MAX-TAKE-ORDERS orders"
    (fold (--try-immediate-buy taker limit) {'rem:amount, 'cnt:0} TAKE-ORDER-ATTEMPTS))

  (defun --try-immediate-sell:object{imm-result}  (taker:string limit:decimal iterator:object{imm-result} _:integer)
    @doc "Immediate sell iteration => Check if an order can be taken and do it if possible"
    (bind (first-bid) {'id:=id, 'amount:=amount, 'price:=price, 'state:=state}
      (bind iterator {'rem:=remaining, 'cnt:=prev-cnt}
        (if (and (and (< 0.0 remaining) ; Do we have some remaining to sell
                      (= state STATE-ACTIVE)) ;Is the bid order valid
                      (>= price limit)) ; Is the price of the bid order higher than the user limit

            (with-capability (DEPOSIT-ACCOUNT-CAP)
              (install-capability (__BASE_MOD__.TRANSFER DEPOSIT-ACCOUNT  (order-account id) (base-with-fee (min remaining amount))))
              (__BASE_MOD__.transfer-create DEPOSIT-ACCOUNT (order-account id) (order-account-guard id) (base-with-fee (min remaining amount)))
              {'rem: (- remaining (take-order id taker (min remaining amount))), 'cnt:(++ prev-cnt)})
            iterator)))
  )

  (defun fold-try-immediate-sell:object{imm-result} (taker:string limit:decimal amount:decimal)
    @doc "Try to sell by taking at most MAX-TAKE-ORDERS orders"
    (fold (--try-immediate-sell taker limit) {'rem:amount, 'cnt:0} TAKE-ORDER-ATTEMPTS))

  ; ---------------------- FUNDS MANAGEMENT FUNCTIONS --------------------------
  ; ----------------------------------------------------------------------------
  (defun transfer-back:string (mod:module{fungible-v2} account:string)
    @doc "Util function to transfer back remaining funds (cleaning) from the deposit account to the user"
    (let ((remaining-quote (mod::get-balance DEPOSIT-ACCOUNT)))
      (if (> remaining-quote 0.0)
          (let ((_ 0))
            (install-capability (mod::TRANSFER DEPOSIT-ACCOUNT account remaining-quote))
            (with-capability (DEPOSIT-ACCOUNT-CAP)
              (mod::transfer DEPOSIT-ACCOUNT account remaining-quote)))
          ""))
  )

  ; ---------------------- EXTERNALLY CALABLE FUNCTIONS ------------------------
  ; ----------------------------------------------------------------------------
  (defun buy-ioc:string (account:string amount:decimal limit:decimal)
    @doc "Buy using a Immediate or Cancel policy"
    (__QUOTE_MOD__.transfer-create account DEPOSIT-ACCOUNT DEPOSIT-ACCOUNT-GUARD (total-quote-with-fee limit amount))
    (fold-try-immediate-buy account limit amount)
    (transfer-back __QUOTE_MOD__ account)
  )

  (defun sell-ioc:string (account:string amount:decimal limit:decimal)
    @doc "Sell using a Immediate or Cancel policy"
    (__BASE_MOD__.transfer-create account DEPOSIT-ACCOUNT DEPOSIT-ACCOUNT-GUARD (base-with-fee amount))
    (fold-try-immediate-sell account limit amount)
    (transfer-back __BASE_MOD__ account)
  )

  (defun buy-fok:string (account:string amount:decimal limit:decimal)
    @doc "Buy using a Fill or Kill policy"
    (__QUOTE_MOD__.transfer-create account DEPOSIT-ACCOUNT DEPOSIT-ACCOUNT-GUARD (total-quote-with-fee limit amount))
    (bind (fold-try-immediate-buy account limit amount) {'rem:=remaining}
      (enforce (= 0.0 remaining) "Order not immediately filled"))
    (transfer-back __QUOTE_MOD__ account)
  )

  (defun sell-fok:string (account:string amount:decimal limit:decimal)
    @doc "Sell using a Fill or Kill policy"
    (__BASE_MOD__.transfer-create account DEPOSIT-ACCOUNT DEPOSIT-ACCOUNT-GUARD (base-with-fee amount))
    (bind (fold-try-immediate-sell account limit amount) {'rem:=remaining}
      (enforce (= 0.0 remaining) "Order not immediately filled"))
    (transfer-back __BASE_MOD__ account)
  )


  (defun buy-gtc:string (account:string account-guard:guard amount:decimal limit:decimal)
    @doc "Buy using a GTC policy. Using an hint is recommended"
    (__QUOTE_MOD__.transfer-create account DEPOSIT-ACCOUNT DEPOSIT-ACCOUNT-GUARD (total-quote-with-fee limit amount))
    (bind (fold-try-immediate-buy account limit amount) {'rem:=remaining, 'cnt:=immediate-count}
      (if (and (> remaining 0.0) (< immediate-count MAX-TAKE-ORDERS))
          (let ((id (next-id)))
            (install-capability (__QUOTE_MOD__.TRANSFER DEPOSIT-ACCOUNT (order-account id) (total-quote limit remaining)))
            (with-capability (DEPOSIT-ACCOUNT-CAP)
              (__QUOTE_MOD__.transfer-create DEPOSIT-ACCOUNT (order-account id)  (order-account-guard id) (total-quote limit remaining)))
            (create-order false account account-guard remaining limit))
          ""))
    (transfer-back __QUOTE_MOD__ account)
  )

  (defun sell-gtc:string (account:string account-guard:guard amount:decimal limit:decimal)
      @doc "Sell using a GTC policy. Using an hint is recommended"
    (__BASE_MOD__.transfer-create account DEPOSIT-ACCOUNT DEPOSIT-ACCOUNT-GUARD (base-with-fee amount))
    (bind (fold-try-immediate-sell account limit amount)
          {'rem:=remaining, 'cnt:=immediate-count}
      (if (and (> remaining 0.0) (< immediate-count MAX-TAKE-ORDERS))
          (let ((id (next-id)))
            (install-capability (__BASE_MOD__.TRANSFER DEPOSIT-ACCOUNT (order-account id) remaining))
            (with-capability (DEPOSIT-ACCOUNT-CAP)
              (__BASE_MOD__.transfer-create DEPOSIT-ACCOUNT (order-account id)  (order-account-guard id) remaining))
            (create-order true account account-guard remaining limit))
          ""))
    (transfer-back __BASE_MOD__ account)
  )

  (defun buy-post-only:integer (account:string account-guard:guard amount:decimal limit:decimal)
    (let ((f-ask (first-ask)))
      (enforce (< limit (at 'price f-ask)) "Limit higher than market price"))
    (__QUOTE_MOD__.transfer-create account DEPOSIT-ACCOUNT DEPOSIT-ACCOUNT-GUARD (total-quote limit amount))
    (let ((id (next-id)))
      (install-capability (__QUOTE_MOD__.TRANSFER DEPOSIT-ACCOUNT (order-account id) (total-quote limit amount)))
      (with-capability (DEPOSIT-ACCOUNT-CAP)
        (__QUOTE_MOD__.transfer-create DEPOSIT-ACCOUNT (order-account id)  (order-account-guard id) (total-quote limit amount))))

    (create-order false account account-guard amount limit)
  )

  (defun sell-post-only:integer (account:string account-guard:guard amount:decimal limit:decimal)
    (let ((f-bid (first-bid)))
      (enforce (> limit (at 'price f-bid)) "Limit lower than market price"))
    (__BASE_MOD__.transfer-create account DEPOSIT-ACCOUNT DEPOSIT-ACCOUNT-GUARD amount)
    (let ((id (next-id)))
      (install-capability (__BASE_MOD__.TRANSFER DEPOSIT-ACCOUNT (order-account id) amount))
      (with-capability (DEPOSIT-ACCOUNT-CAP)
        (__BASE_MOD__.transfer-create DEPOSIT-ACCOUNT (order-account id)  (order-account-guard id) amount)))

    (create-order true account account-guard amount limit)
  )

)
