MACROS=-DPAIR=KDA-ABC -D__QUOTE_MOD__=coin -D__BASE_MOD__=ABC_NS.abc -D__MIN_AMOUNT__=0.001 -D__FEE_ACOUNT__=fee-receiver

all: .gen/bro-dex-core-KDA-ABC.pact .gen/bro-dex-wrapper-KDA-ABC.pact .gen/bro-dex-view-KDA-ABC.pact

.gen:
	mkdir -p .gen

.gen/bro-dex-core-KDA-ABC.pact: ../pact/bro-dex-core.pact .gen
	m4 ${MACROS} $< > $@

.gen/bro-dex-wrapper-KDA-ABC.pact: ../pact/bro-dex-wrapper.pact .gen
	m4 ${MACROS} $< > $@

.gen/bro-dex-view-KDA-ABC.pact: ../pact/bro-dex-view.pact .gen
	m4 ${MACROS} $< > $@

test-core: .gen/bro-dex-core-KDA-ABC.pact .gen/bro-dex-view-KDA-ABC.pact
	pact test-bro-dex-core.repl

test-wrapper-ioc: .gen/bro-dex-core-KDA-ABC.pact .gen/bro-dex-wrapper-KDA-ABC.pact .gen/bro-dex-view-KDA-ABC.pact
	pact test-bro-dex-wrapper-ioc.repl

test-wrapper-gtc: .gen/bro-dex-core-KDA-ABC.pact .gen/bro-dex-wrapper-KDA-ABC.pact .gen/bro-dex-view-KDA-ABC.pact
	pact test-bro-dex-wrapper-gtc.repl

test-wrapper-fok: .gen/bro-dex-core-KDA-ABC.pact .gen/bro-dex-wrapper-KDA-ABC.pact .gen/bro-dex-view-KDA-ABC.pact
	pact test-bro-dex-wrapper-fok.repl

test-wrapper-post-only: .gen/bro-dex-core-KDA-ABC.pact .gen/bro-dex-wrapper-KDA-ABC.pact .gen/bro-dex-view-KDA-ABC.pact
	pact test-bro-dex-wrapper-post-only.repl

test: test-core test-wrapper-ioc test-wrapper-gtc test-wrapper-fok test-wrapper-post-only

clean:
	rm -rf .gen
