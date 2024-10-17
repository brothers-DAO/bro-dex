import YAML from 'yaml'
import useSWRImmutable from 'swr/immutable'

const TOKENS_DB = import.meta.env.VITE_TOKENS_DB
const VITE_TOKENS_DB_NETWORK = import.meta.env.VITE_TOKENS_DB_NETWORK

const make_absolute_img =  ([k,{img,...rest}]) => [k,{img:`${TOKENS_DB}/${img}`, ...rest}]

function useTokenDb()
{
  return useSWRImmutable("tokens_db", ()=> fetch(`${TOKENS_DB}/tokens.yaml`)
                                          .then(r => r.text())
                                          .then(YAML.parse)
                                          .then(x => x[VITE_TOKENS_DB_NETWORK])
                                          .then(x => Object.fromEntries(Object.entries(x).map(make_absolute_img))))
}

export function useTokenInfo(token_mod)
{
  const {data, error} = useTokenDb();
  if(error)
    console.log(error)
  return {token_info:data?.[token_mod], error};
}