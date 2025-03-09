import {useLocalPactImmutable} from './pact';
import {to_decimal, to_module} from './utils.js';

const NETWORK = import.meta.env.VITE_NETWORK;
const CHAIN = import.meta.env.VITE_CHAIN;
const MODULE = import.meta.env.VITE_FAUCET_MODULE;
const FAUCET_ID = import.meta.env.VITE_FAUCET_ID;


export function useFaucetDetails()
{
  const code = `{'gas_station:${MODULE}.GAS-STATION, 'details:(at '${FAUCET_ID} ${MODULE}.FAUCETS)}`
  const {data, error} = useLocalPactImmutable(code, NETWORK, CHAIN)
  if(data)
  {
    const details = data.details.map( ({fungible, amount, short_name}) => ({short_name, fungible:to_module(fungible), amount:to_decimal(amount)}))
    return {details, gas_station:data.gas_station, error}
  }
  else
    return {gas_station:null, details:null, error}
}
