(module bro-dex-wrapper-PAIR GOVERNANCE
  ;SPDX-License-Identifier: BUSL-1.1
  ; => https://github.com/brothers-DAO/bro-dex/blob/main/LICENSE
  (use free.util-math)
  (use bro-dex-core-PAIR)

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

  ; Just a list to improve a little bit efficiency
  (defconst TAKE-ORDER-ATTEMPTS (enumerate 1 MAX-TAKE-ORDERS))

  (defconst RETURN-SUCCESS "DEX Order successful")

  ; ------------------------ UTIL FUNCTIONS ------------------------------------
  ; ----------------------------------------------------------------------------
  (defun and-3:bool (a:bool b:bool c:bool)
    @doc "And 3 booleans"
    (and a (and b c)))

  (defun is-order-nil:bool (order:object{order-sch})
    @doc "True if the order is NIL"
    (= NIL (at 'id order)))

  (defun --create-account:bool (fungible:module{fungible-v2} account:string guard:guard)
    @doc "Create an account if not exist"
    (let ((bal (try -1.0 (fungible::get-balance account))))
      (if (= bal -1.0)
          (do (fungible::create-account account guard) true)
          false))
  )

  (defun --init-buy-accounts:bool (account:string guard:guard amount:decimal)
    @doc "Do the common buying stuffs: \
       \   1 - Transfer QUOTE to the DEPOSIT account \
       \   2 - Create BASE user account"
    (__QUOTE_MOD__.transfer-create account DEPOSIT-ACCOUNT DEPOSIT-ACCOUNT-GUARD amount)
    (--create-account __BASE_MOD__ account guard)
  )

  (defun --init-sell-accounts:bool (account:string guard:guard amount:decimal)
    @doc "Do the common selling stuffs: \
       \   1 - Transfer BASE to the DEPOSIT account \
       \   2 - Create QUOTE user account"
    (__BASE_MOD__.transfer-create account DEPOSIT-ACCOUNT DEPOSIT-ACCOUNT-GUARD amount)
    (--create-account __QUOTE_MOD__ account guard)
  )

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
        (if (and-3 (< 0.0 remaining) ; Do we have some remaining to buy
                   (= state STATE-ACTIVE) ;Is the ask order valid
                   (<= price limit)) ; Is the price of the ask order less than the user limit
          ; If the 3 above conditions are met we can take the order:
          ;   Step 1 - Transfer the quote to the orders's account
          (do (install-capability (__QUOTE_MOD__.TRANSFER DEPOSIT-ACCOUNT  (order-account id) (total-quote-with-fee price (min remaining amount))))
              (with-capability (DEPOSIT-ACCOUNT-CAP)
                (__QUOTE_MOD__.transfer-create DEPOSIT-ACCOUNT (order-account id) (order-account-guard id) (total-quote-with-fee price (min remaining amount))))
          ;  Step 2 - And take it, updating in the same time the iterator.
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
        (if (and-3 (< 0.0 remaining) ; Do we have some remaining to sell
                   (= state STATE-ACTIVE) ;Is the bid order valid
                   (>= price limit)) ; Is the price of the bid order higher than the user limit
          ; If the 3 above conditions are met we can take the order:
          ;   Step 1 - Transfer the base to the order's account
          (do (install-capability (__BASE_MOD__.TRANSFER DEPOSIT-ACCOUNT  (order-account id) (base-with-fee (min remaining amount))))
              (with-capability (DEPOSIT-ACCOUNT-CAP)
          ;  Step 2 - And take it, updating in the same time the iterator.
                (__BASE_MOD__.transfer-create DEPOSIT-ACCOUNT (order-account id) (order-account-guard id) (base-with-fee (min remaining amount))))
              {'rem: (- remaining (take-order id taker (min remaining amount))), 'cnt:(++ prev-cnt)})
          iterator)))
  )

  (defun fold-try-immediate-sell:object{imm-result} (taker:string limit:decimal amount:decimal)
    @doc "Try to sell by taking at most MAX-TAKE-ORDERS orders"
    (fold (--try-immediate-sell taker limit) {'rem:amount, 'cnt:0} TAKE-ORDER-ATTEMPTS))

  ; ---------------------- FUNDS MANAGEMENT FUNCTIONS --------------------------
  ; ----------------------------------------------------------------------------
  (defun transfer-back:string (token:module{fungible-v2} account:string)
    @doc "Util function to transfer back remaining funds (cleaning) from the deposit account to the user"
    (let ((remaining (token::get-balance DEPOSIT-ACCOUNT)))
      (if (> remaining 0.0)
          (do (install-capability (token::TRANSFER DEPOSIT-ACCOUNT account remaining))
              (with-capability (DEPOSIT-ACCOUNT-CAP)
                (token::transfer DEPOSIT-ACCOUNT account remaining)))
          RETURN-SUCCESS))
  )

  ; ---------------------- EXTERNALLY CALABLE FUNCTIONS ------------------------
  ; ----------------------------------------------------------------------------
  (defun buy-ioc:string (account:string account-guard:guard amount:decimal limit:decimal)
    @doc "Buy using a Immediate or Cancel policy"
    (--init-buy-accounts account account-guard (total-quote-with-fee limit amount))
    ; Step 1: Try to buy as much as possible from available orders
    (fold-try-immediate-buy account limit amount)
    ; Step 2: Refund the user if some quote are remaining
    (transfer-back __QUOTE_MOD__ account)
  )

  (defun sell-ioc:string (account:string account-guard:guard amount:decimal limit:decimal)
    @doc "Sell using a Immediate or Cancel policy"
    (--init-sell-accounts account account-guard (base-with-fee amount))
    ; Step 1: Try to sell as much as possible from available orders
    (fold-try-immediate-sell account limit amount)
    ; Step 2: Refund the user if some quote are remaining
    (transfer-back __BASE_MOD__ account)
  )

  (defun buy-fok:string (account:string account-guard:guard amount:decimal limit:decimal)
    @doc "Buy using a Fill or Kill policy"
    (--init-buy-accounts account account-guard (total-quote-with-fee limit amount))
    ; Step 1: Try to buy as much as possible from available orders
    (bind (fold-try-immediate-buy account limit amount) {'rem:=remaining}
      ; Step 2: Kill unless nothing is remaining
      (enforce (= 0.0 remaining) "Order not immediately filled"))
    ; Step 3: Refund the user if some quote are remaining
    (transfer-back __QUOTE_MOD__ account)
  )

  (defun sell-fok:string (account:string account-guard:guard amount:decimal limit:decimal)
    @doc "Sell using a Fill or Kill policy"
    (--init-sell-accounts account account-guard (base-with-fee amount))
    ; Step 1: Try to sell as much as possible from available orders
    (bind (fold-try-immediate-sell account limit amount) {'rem:=remaining}
      ; Step 2: Kill unless nothing is remaining
      (enforce (= 0.0 remaining) "Order not immediately filled"))
    ; Step 3: Refund the user if some quote are remaining
    (transfer-back __BASE_MOD__ account)
  )

  (defun buy-gtc:string (account:string account-guard:guard amount:decimal limit:decimal)
    @doc "Buy using a GTC policy"
    (--init-buy-accounts account account-guard (total-quote-with-fee limit amount))
    ; Step 1: Try to buy as much as possible from available orders
    (bind (fold-try-immediate-buy account limit amount) {'rem:=remaining, 'cnt:=immediate-count}
      ; We have to check if the "immediate buy" cleared the order: ie
      ;   - Nothing remains.
      ;   - We didn't reach the limit of MAX-TAKE-ORDERS. If yes, it probably means that some Asks are still on the
      ;     orderbook at a lower price. => This is a bad, but it's better to do nothing, instead of publishing a non-sense Bid.
      (if (and (>= remaining MIN-AMOUNT) (< immediate-count MAX-TAKE-ORDERS))
          ; Step 2: Our order is not cleared, and all existing Asks orders are higher than our limit. We have to publish a Bid.
          (let ((id (next-id)))
            ; Step 2.1: Transfer the quote.
            (install-capability (__QUOTE_MOD__.TRANSFER DEPOSIT-ACCOUNT (order-account id) (total-quote limit remaining)))
            (with-capability (DEPOSIT-ACCOUNT-CAP)
              (__QUOTE_MOD__.transfer-create DEPOSIT-ACCOUNT (order-account id)  (order-account-guard id) (total-quote limit remaining)))
            ; Step 2.2: Create the order.
            (create-order false account account-guard remaining limit))
          ""))
    ; Step 3: Refund the user with the remaining quote.
    ;
    (transfer-back __QUOTE_MOD__ account)
  )

  (defun sell-gtc:string (account:string account-guard:guard amount:decimal limit:decimal)
    @doc "Sell using a GTC policy"
    ; For comments, please refer to buy-gtc
    (--init-sell-accounts account account-guard (base-with-fee amount))
    (bind (fold-try-immediate-sell account limit amount)
          {'rem:=remaining, 'cnt:=immediate-count}
      (if (and (>= remaining MIN-AMOUNT) (< immediate-count MAX-TAKE-ORDERS))
          (let ((id (next-id)))
            (install-capability (__BASE_MOD__.TRANSFER DEPOSIT-ACCOUNT (order-account id) remaining))
            (with-capability (DEPOSIT-ACCOUNT-CAP)
              (__BASE_MOD__.transfer-create DEPOSIT-ACCOUNT (order-account id)  (order-account-guard id) remaining))
            (create-order true account account-guard remaining limit))
          ""))
    (transfer-back __BASE_MOD__ account)
  )

  (defun buy-post-only:string (account:string account-guard:guard amount:decimal limit:decimal)
      ; To protect the user from obvious arbitrage, we check that:
      ; either the orderbook is empty (first-ask is NIL), or we are lower than the first current ask
    (let ((f-ask (first-ask)))
      (enforce (or? (is-order-nil) (compose (at 'price) (< limit)) f-ask) "Limit higher than market price"))

    (--init-buy-accounts account account-guard (total-quote limit amount))
    (let ((id (next-id)))
      (install-capability (__QUOTE_MOD__.TRANSFER DEPOSIT-ACCOUNT (order-account id) (total-quote limit amount)))
      (with-capability (DEPOSIT-ACCOUNT-CAP)
        (__QUOTE_MOD__.transfer-create DEPOSIT-ACCOUNT (order-account id)  (order-account-guard id) (total-quote limit amount))))

    (create-order false account account-guard amount limit)
    RETURN-SUCCESS
  )

  (defun sell-post-only:string (account:string account-guard:guard amount:decimal limit:decimal)
    ; To protect the user from obvious arbitrage, we check that:
    ; either the orderbook is empty (first-bid is NIL), or we are higer than the first current bid
    (let ((f-bid (first-bid)))
      (enforce (or? (is-order-nil) (compose (at 'price) (> limit)) f-bid) "Limit lower than market price"))

    (--init-sell-accounts account account-guard amount)
    (let ((id (next-id)))
      (install-capability (__BASE_MOD__.TRANSFER DEPOSIT-ACCOUNT (order-account id) amount))
      (with-capability (DEPOSIT-ACCOUNT-CAP)
        (__BASE_MOD__.transfer-create DEPOSIT-ACCOUNT (order-account id)  (order-account-guard id) amount)))

    (create-order true account account-guard amount limit)
    RETURN-SUCCESS
  )

)
