MACROS=-DPAIR=KDA-ABC -D__QUOTE_MOD__=coin -D__BASE_MOD__=ABC_NS.abc -D__MIN_AMOUNT__=0.001 -D__MIN_PRICE__=0.1 -D__DECIMALS__=6 -D__FEE_ACOUNT__=fee-receiver

all: .gen/bro-dex-core-KDA-ABC.pact .gen/bro-dex-wrapper-KDA-ABC.pact .gen/bro-dex-view-KDA-ABC.pact .gen/rb-tree.pact

.gen:
	mkdir -p .gen

.gen/bro-dex-core-KDA-ABC.pact: ../pact/bro-dex-core.pact .gen
	m4 ${MACROS} $< > $@

.gen/bro-dex-wrapper-KDA-ABC.pact: ../pact/bro-dex-wrapper.pact .gen
	m4 ${MACROS} $< > $@

.gen/bro-dex-view-KDA-ABC.pact: ../pact/bro-dex-view.pact .gen
	m4 ${MACROS} $< > $@

.gen/rb-tree.pact: ../pact_RB_tree/pact/rb-tree.pact .gen
	m4 ${MACROS} $< > $@

CORE_MODS = .gen/bro-dex-core-KDA-ABC.pact  .gen/rb-tree.pact


test-core: ${CORE_MODS} .gen/bro-dex-view-KDA-ABC.pact
	pact test-bro-dex-core.repl

test-wrapper-ioc: ${CORE_MODS} .gen/bro-dex-wrapper-KDA-ABC.pact .gen/bro-dex-view-KDA-ABC.pact
	pact test-bro-dex-wrapper-ioc.repl

test-wrapper-gtc: ${CORE_MODS} .gen/bro-dex-wrapper-KDA-ABC.pact .gen/bro-dex-view-KDA-ABC.pact
	pact test-bro-dex-wrapper-gtc.repl

test-wrapper-fok: ${CORE_MODS} .gen/bro-dex-wrapper-KDA-ABC.pact .gen/bro-dex-view-KDA-ABC.pact
	pact test-bro-dex-wrapper-fok.repl

test-wrapper-post-only: ${CORE_MODS} .gen/bro-dex-wrapper-KDA-ABC.pact .gen/bro-dex-view-KDA-ABC.pact
	pact test-bro-dex-wrapper-post-only.repl

test: test-core test-wrapper-ioc test-wrapper-gtc test-wrapper-fok test-wrapper-post-only

clean:
	rm -rf .gen
