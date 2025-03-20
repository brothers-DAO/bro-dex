import {Pact} from '@kadena/client';
import {to_pact_int, to_pact_decimal, gen_nonce} from './utils';
import {core_mod, wrapper_mod} from './bro-dex-common'

/* Modules refs */
const NETWORK = import.meta.env.VITE_NETWORK;
const CHAIN = import.meta.env.VITE_CHAIN;

const make_cancel_order = (pair, account, key, order) =>
  Pact.builder.execution(`(${core_mod(pair.name)}.cancel-order ${(order.id+0n).toString()})`)
              .setMeta({chainId:CHAIN, gasLimit:10000, gasPrice:1e-8, sender:account})
              .setNetworkId(NETWORK)
              .addSigner(key, (signFor) => [signFor("coin.GAS")])
              .addSigner(key, (signFor) => [signFor(`${core_mod(pair.name)}.CANCEL-ORDER`, to_pact_int(order.id))])
              .setNonce(gen_nonce)
              .createTransaction();

const make_order = (direction, type, pair, account, key, deposit, amount, limit, total) =>
    Pact.builder.execution(`(${wrapper_mod(pair.name)}.${direction}-${type} "${account}" (read-keyset 'k) ${amount.toFixed(12)} ${limit.toFixed(12)})`)
                .setMeta({chainId:CHAIN, gasLimit:type=="post-only"?10000:60000, gasPrice:1e-8, sender:account})
                .setNetworkId(NETWORK)
                .addData("k",{pred:"keys-all", keys:[key]})
                .addSigner(key, (signFor) => [signFor("coin.GAS")])
                .addSigner(key, (signFor) => [signFor(`${direction=="buy"?pair.quote_module:pair.base_module}.TRANSFER`, account, deposit, to_pact_decimal(total))])
                .setNonce(gen_nonce)
                .createTransaction();



export {make_cancel_order, make_order}
