import {Pact} from '@kadena/client';

const NETWORK = import.meta.env.VITE_NETWORK;
const CHAIN = import.meta.env.VITE_CHAIN;
const MODULE = import.meta.env.VITE_FAUCET_MODULE;
const FAUCET_ID = import.meta.env.VITE_FAUCET_ID;
const GAS_STATION = import.meta.env.VITE_FAUCET_GAS_STATION;

const retrieve_coins = (account, key) =>
    Pact.builder.execution(`${MODULE}.retrieve-coins("${faucet-id}" "${account}" (read-keyset 'k))`)
                .setMeta({chainId:CHAIN, gasLimit:10000, gasPrice:1e-8, sender:GAS_STATION})
                .setNetworkId(NETWORK)
                .addData("k",{pred:"keys-all", keys:[key]})
                .createTransaction();
