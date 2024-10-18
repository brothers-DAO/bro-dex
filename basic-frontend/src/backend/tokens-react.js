import {Decimal} from 'decimals';
import {useLocalPact, useLocalPactImmutable} from './pact';
import {to_decimal} from './utils.js';

const ZERO = Decimal("0.0");
const NETWORK = import.meta.env.VITE_NETWORK
const CHAIN = import.meta.env.VITE_CHAIN

export function useTokenBalance(account, token)
{
  const code = (account && token )?`(try 0.0 (${token}.get-balance ${account})`:null;
  const {data, error, mutate} = useLocalPact(code, NETWORK, CHAIN, {refreshInterval: 61_000})

  if(data)
    return {balance:to_decimal(data)}
  else
    return {balance:null, mutate, error}
}

export function useTokensBalance(account, tokenA, tokenB)
{
  const code = (account && tokenA && tokenB)?`[(try 0.0 (${tokenA}.get-balance "${account}")), (try 0.0 (${tokenB}.get-balance "${account}"))]`:null;
  const {data, error, mutate} = useLocalPact(code, NETWORK, CHAIN, {refreshInterval: 61_000})
  if(data)
  {
    const [balance_a, balance_b] = data.map(to_decimal);
    return {balance_a, balance_b, mutate}
  }
  else
    return {balance_a:null, balance_b:null, mutate, error}
}

export function useGuard(account)
{
  const {data:guard, error} = useLocalPactImmutable(account?`(try {} (at 'guard (coin.details "${account}")))`:null, NETWORK, CHAIN);
  return {guard, error};
}

export function useSingleKeyAccount(account)
{
  const {guard, error} = useGuard(account);

  if(guard)
  {
    if(guard?.pred == "keys-all" && guard?.keys.length == 1)
      return {key:guard.keys[0], error}
    else
      {
        console.warn("Unsupported guard:")
        console.warn(guard)
        return {key:null, error}
      }
  }
  else
    return {key:null, error}
}
