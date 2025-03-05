import {useLocalPact, useLocalPactImmutable} from './pact';
import {to_decimal} from './utils.js';

const NETWORK = import.meta.env.VITE_NETWORK
const CHAIN = import.meta.env.VITE_CHAIN

const K_ACCOUNT_REGEXP = /k:([0-9a-f]{64})/


export function useTokenBalance(account, token)
{
  const code = (account && token )?`(try 0.0 (${token}.get-balance ${account})`:null;
  const {data, error, mutate} = useLocalPact(code, NETWORK, CHAIN, {refreshInterval: 61_000})

  if(data)
    return {balance:to_decimal(data)}
  else
    return {balance:null, mutate, error}
}

export function useTokensBalance(account, ...tokens)
{
  const code = (account && tokens)?`(map (lambda (x:module{fungible-v2}) (try 0.0 (x::get-balance "${account}"))) [${tokens.join(" ")}])`:null
  const {data, error, mutate} = useLocalPact(code, NETWORK, CHAIN, {refreshInterval: 61_000})
  if(data)
    return {balances:data.map(to_decimal), mutate}
  else
    return {balances:Array(tokens.length).fill(null), mutate, error}
}

export function useGuard(account)
{
  const {data:guard, error} = useLocalPactImmutable(account?`(try {} (at 'guard (coin.details "${account}")))`:null, NETWORK, CHAIN);
  return {guard, error};
}

export function useSingleKeyAccount(account)
{
  const {guard, error} = useGuard(account);

  const k_match = account && account.match(K_ACCOUNT_REGEXP)

  if(guard)
  {
    if(guard?.pred == "keys-all" && guard?.keys.length == 1)
      return {key:guard.keys[0], error}
    else if(Object.keys(guard).length === 0 && k_match) /*Non existing account */
    {
      console.log("Extracting key from missing k:account")
      return {key:k_match[1], error:null}
    }
    else
    {
      console.warn("Unsupported guard:")
      console.warn(guard)
      return {key:null, error}
    }
  }

  return {key:null, error}
}
