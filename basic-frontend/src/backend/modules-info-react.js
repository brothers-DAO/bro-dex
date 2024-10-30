import {useLocalPactImmutable} from './pact';

const NETWORK = import.meta.env.VITE_NETWORK
const CHAIN = import.meta.env.VITE_CHAIN

export function useModulesHash(modules)
{
  const {data, error} = useLocalPactImmutable(modules.every(x=>x!=null)?`(map (compose (describe-module) (at 'hash)) ${JSON.stringify(modules)})`:null, NETWORK,CHAIN);
  if(error)
    console.error(error);
  return data ?? modules.map(()=> "")
}
