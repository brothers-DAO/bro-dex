(namespace "RB_TREE_NS")
include(`../pact_RB_tree/pact/rb-tree.pact')dnl

ifdef(`__INIT__',dnl
(create-table nodes)
(create-table trees))dnl
