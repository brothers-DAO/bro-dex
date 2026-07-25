DEFS=defs/ABC-KDA.m4

PACT = pact

POST =

all: .gen/bro-dex-core-KDA-ABC.pact .gen/bro-dex-wrapper-KDA-ABC.pact .gen/bro-dex-view-KDA-ABC.pact .gen/rb-tree.pact

.gen:
	mkdir -p .gen

.gen/bro-dex-core-KDA-ABC.pact: ../pact/bro-dex-core.pact ${DEFS} | .gen
	m4 ${DEFS} $< > $@

.gen/bro-dex-repl-KDA-ABC.pact: ../pact/bro-dex-repl.pact ${DEFS} | .gen
	m4 ${DEFS} $< > $@

.gen/bro-dex-wrapper-KDA-ABC.pact: ../pact/bro-dex-wrapper.pact ${DEFS} | .gen
	m4 ${DEFS} $< > $@

.gen/bro-dex-view-KDA-ABC.pact: ../pact/bro-dex-view.pact ${DEFS} | .gen
	m4 ${DEFS} $< > $@

.gen/rb-tree.pact: ../pact_RB_tree/pact/rb-tree.pact ${DEFS} | .gen
	m4 $< > $@

CORE_MODS = .gen/bro-dex-core-KDA-ABC.pact .gen/bro-dex-repl-KDA-ABC.pact .gen/rb-tree.pact


test-core: ${CORE_MODS} .gen/bro-dex-view-KDA-ABC.pact
	${PACT} test-bro-dex-core.repl ${POST}

test-wrapper-ioc: ${CORE_MODS} .gen/bro-dex-wrapper-KDA-ABC.pact .gen/bro-dex-view-KDA-ABC.pact
	${PACT} test-bro-dex-wrapper-ioc.repl ${POST}

test-wrapper-gtc: ${CORE_MODS} .gen/bro-dex-wrapper-KDA-ABC.pact .gen/bro-dex-view-KDA-ABC.pact
	${PACT} test-bro-dex-wrapper-gtc.repl ${POST}

test-wrapper-fok: ${CORE_MODS} .gen/bro-dex-wrapper-KDA-ABC.pact .gen/bro-dex-view-KDA-ABC.pact
	${PACT} test-bro-dex-wrapper-fok.repl ${POST}

test-wrapper-post-only: ${CORE_MODS} .gen/bro-dex-wrapper-KDA-ABC.pact .gen/bro-dex-view-KDA-ABC.pact
	${PACT} test-bro-dex-wrapper-post-only.repl ${POST}

gen: ${CORE_MODS} .gen/bro-dex-view-KDA-ABC.pact .gen/bro-dex-wrapper-KDA-ABC.pact

test: test-core test-wrapper-ioc test-wrapper-gtc test-wrapper-fok test-wrapper-post-only

clean:
	rm -rf .gen
