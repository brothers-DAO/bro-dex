import {Pact} from '@kadena/client';

const NETWORK = import.meta.env.VITE_NETWORK;
const CHAIN = import.meta.env.VITE_CHAIN;
const MODULE = import.meta.env.VITE_FAUCET_MODULE;
const FAUCET_ID = import.meta.env.VITE_FAUCET_ID;

export const retrieve_coins = (account, key, gas_station) =>
    Pact.builder.execution(`(${MODULE}.retrieve-coins "${FAUCET_ID}" "${account}" (read-keyset 'k))`)
                .setMeta({chainId:CHAIN, gasLimit:2500 , gasPrice:1e-8, sender:gas_station})
                .setNetworkId(NETWORK)
                .addData("k",{pred:"keys-all", keys:[key]})
                .createTransaction();
