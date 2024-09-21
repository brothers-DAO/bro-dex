(namespace "__NAMESPACE__")
include(`../pact/bro-dex-core.pact')dnl

ifdef(`__INIT__',dnl
(create-table seed-table)
(create-table order-table)
(create-table pointer-table)
(init))dnl
