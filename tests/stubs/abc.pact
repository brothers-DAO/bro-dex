(module abc GOVERNANCE
  (implements fungible-v2)
  (implements fungible-xchain-v1)

  (use free.util-fungible)
  (use free.util-chain-data)

  (defcap GOVERNANCE () true)
  (defcap INIT()
    (compose-capability (GOVERNANCE)))

  ;-----------------------------------------------------------------------------
  ; Constants
  ;-----------------------------------------------------------------------------
  (defconst MINIMUM_PRECISION:integer 12)


  ; All deployed chain
  (defconst DEPLOYED-CHAINS ["1", "2", "8"])

  ;-----------------------------------------------------------------------------
  ; Schemas and Tables
  ;-----------------------------------------------------------------------------
  (defschema user-accounts-schema
    balance:decimal
    guard:guard)

  (deftable user-accounts-table:{user-accounts-schema})

  (defschema init-sch
    init:bool)

  (deftable init-table:{init-sch})

  ;-----------------------------------------------------------------------------
  ; Capabilities
  ;-----------------------------------------------------------------------------
  (defcap DEBIT (sender:string)
    "Capability for managing debiting operations"
    (enforce (!= sender "") "Invalid sender")
    (with-read user-accounts-table sender {'guard:=g}
      (enforce-guard g)))


  (defcap CREDIT (receiver:string)
    "Capability for managing crediting operations"
    (enforce (!= receiver "") "Invalid receiver"))

  (defcap ROTATE (account:string)
    "Autonomously managed capability for guard rotation"
    @managed
    true)

  (defcap TRANSFER:bool (sender:string receiver:string amount:decimal)
    "Capability for allowing transfers"
    @managed amount TRANSFER-mgr
    (enforce-valid-transfer sender receiver (precision) amount)
    (compose-capability (DEBIT sender))
    (compose-capability (CREDIT receiver))
  )

  (defun TRANSFER-mgr:decimal (managed:decimal requested:decimal)
    (let ((newbal (- managed requested)))
      (enforce (>= newbal 0.0)
        (format "TRANSFER exceeded for balance {}" [managed]))
      newbal)
  )

  (defcap TRANSFER_XCHAIN:bool (sender:string receiver:string amount:decimal target-chain:string)
    "Capability for allowing X-vhain transfers"
    @managed amount TRANSFER_XCHAIN-mgr
    (enforce-valid-transfer-xchain sender receiver (precision) amount)
    (compose-capability (DEBIT sender))
  )

  (defun TRANSFER_XCHAIN-mgr:decimal (managed:decimal requested:decimal)
    (enforce (>= managed requested)
      (format "TRANSFER_XCHAIN exceeded for balance {}" [managed]))
    0.0
  )

  (defcap TRANSFER_XCHAIN_RECD:bool (sender:string receiver:string amount:decimal source-chain:string)
    @event
    true
  )

  ;-----------------------------------------------------------------------------
  ; Utility functions
  ;-----------------------------------------------------------------------------
  (defun enforce-not-initalized:bool ()
    (with-default-read init-table "" {'init:false} {'init:=init}
      (enforce (not init) "Already intialized")))

  (defun is-deployed-chain:bool (chain:string)
    (contains chain DEPLOYED-CHAINS))

  (defun enforce-is-deployed-chain:bool (chain:string)
    (enforce (is-deployed-chain chain) (format "BRO is not deployed on chain {}" [chain])))

  ;-----------------------------------------------------------------------------
  ; fungible-v2 standard functions
  ;-----------------------------------------------------------------------------
  (defun enforce-unit:bool (amount:decimal)
    (enforce-precision (precision) amount))

  (defun create-account:string (account:string guard:guard)
    (enforce-valid-account account)
    (enforce-reserved account guard)
    (insert user-accounts-table account
            {'balance: 0.0,
             'guard: guard})
    (format "Account {} created" [account])
  )

  (defun get-balance:decimal (account:string)
    (with-read user-accounts-table account {'balance:= balance }
      balance))

  (defun details:object{fungible-v2.account-details} (account:string)
    (with-read user-accounts-table account {'balance:= bal, 'guard:= g}
               {'account: account,
                'balance: bal,
                'guard: g }))

  (defun rotate:string (account:string new-guard:guard)
    (enforce-reserved account new-guard)
    (with-capability (ROTATE account)
      (with-read user-accounts-table account {'guard:=old-guard}
        (enforce-guard old-guard))
      (update user-accounts-table account {'guard: new-guard}))
  )

  (defun precision:integer()
    MINIMUM_PRECISION)

  ;-----------------------------------------------------------------------------
  ; Transfer functions
  ;-----------------------------------------------------------------------------
  (defun transfer:string (sender:string receiver:string amount:decimal)
    (enforce-valid-transfer sender receiver MINIMUM_PRECISION amount)
    (with-capability (TRANSFER sender receiver amount)
      (debit sender amount)
      (with-read user-accounts-table receiver
        { "guard" := g }
        (credit receiver g amount))
      )
    )

  (defun transfer-create:string (sender:string receiver:string receiver-guard:guard amount:decimal )
    (enforce-valid-transfer sender receiver MINIMUM_PRECISION amount)
    (with-capability (TRANSFER sender receiver amount)
      (debit sender amount)
      (credit receiver receiver-guard amount))
  )

  (defun debit:string (account:string amount:decimal)
    (require-capability (DEBIT account))
    (with-read user-accounts-table account {'balance:= balance}
      (enforce (<= amount balance) "Insufficient funds")
      (update user-accounts-table account {'balance: (- balance amount)}))
  )

  (defun credit:string (account:string guard:guard amount:decimal)
    (require-capability (CREDIT account))
    (with-default-read user-accounts-table account
                       {'balance:-1.0, 'guard: guard}
                       {'balance:= balance, 'guard:= retg}
      ; we don't want to overwrite an existing guard with the user-supplied one
      (enforce (= retg guard) "Account guards do not match")

      (let ((is-new (if (= balance -1.0)
                        (enforce-reserved account guard)
                        false)))
        (write user-accounts-table account
          {'balance: (if is-new amount (+ balance amount)),
           'guard:retg})))
  )

  (defpact transfer-crosschain:string (sender:string receiver:string receiver-guard:guard
                                       target-chain:string amount:decimal)

    (step
      (with-capability (TRANSFER_XCHAIN sender receiver amount target-chain)
        (enforce-valid-transfer-xchain sender receiver (precision) amount)
        (enforce-valid-chain-id target-chain)
        (enforce-not-same-chain target-chain)
        (enforce-is-deployed-chain target-chain)
        (debit sender amount)
        (emit-event (TRANSFER sender "" amount))

        (let ((crosschain-details:object{fungible-xchain-sch}
                {'receiver: receiver,
                'receiver-guard: receiver-guard,
                'amount: amount,
                'source-chain: (chain-id)}))
           (yield crosschain-details target-chain))))
    (step
      (resume {'receiver:= receiver,
               'receiver-guard:= receiver-guard,
               'amount:= amount,
               'source-chain:= source-chain}

        (emit-event (TRANSFER "" receiver amount))
        (emit-event (TRANSFER_XCHAIN_RECD "" receiver amount source-chain))
        (with-capability (CREDIT receiver)
          (credit receiver receiver-guard amount))
        ))
  )

  ;-----------------------------------------------------------------------------
  ; Init function
  ;-----------------------------------------------------------------------------


  (defun init:string ()
    ; Init should happen only once
    (enforce-not-initalized)
    (with-capability (INIT)
      (write init-table "" {'init:true}))
    "BRO intialized"
  )
)
