import {createClient, getHostUrl,Pact} from '@kadena/client'
import useSWR from 'swr';
import useSWRImmutable from 'swr/immutable'

const LOCAL_GAS_LIMIT = 150000



const client = createClient(getHostUrl(import.meta.env.VITE_ENDPOINT))

function local_check(cmd, options)
{
  return client.local(cmd, options)
        .then((resp) => { if(resp?.result?.status !== 'success')
                           {console.warn(resp); throw Error(`Error in local call:${resp?.result?.error?.message}`);}
                          else
                            return resp.result.data;});
}

function check_res(resp)
{
  if(resp?.result?.status !== 'success')
    {console.warn(resp); throw Error(`Tx error:${resp?.result?.error?.message}`);}
  else
    return resp
}

function local_pact(pact_code, network, chain)
{
  const cmd = Pact.builder
                  .execution(pact_code)
                  .setMeta({chainId:chain, gasLimit:LOCAL_GAS_LIMIT})
                  .setNetworkId(network)
                  .createTransaction();
  return local_check(cmd, {signatureVerification:false, preflight:false});
}

function submit(cmd)
{
  return client.submitOne(cmd)
}

function status(cmd, network, chain)
{
  return client.pollStatus({requestKey:cmd.hash, chainId:chain , networkId: network},
                           {timeout:1000*300, interval:5000})
               .then( x=> x?.[cmd.hash])
}

function useTrxStatusImmutable(trx, do_poll=false)
{
  return useSWRImmutable(trx, x => (!do_poll?client.getStatus(trx)
                                            :client.pollStatus(trx, {timeout:1000*300, interval:5000}))
                                   .then((res) => check_res(res[x.requestKey])), {shouldRetryOnError:false})

}

function useSubmitResult(cmd)
{
  return useSWRImmutable(cmd?["/submit",cmd]:null, x  => submit(x[1]), {shouldRetryOnError:false});
}


function useTrxDate(trx, network, chain)
{
  const {data} = useTrxStatusImmutable(trx?{requestKey:trx, chainId:chain , networkId: network}:null)
  return data && new Date(data.metaData.blockTime/1000.0)
}

function usePreflight(cmd)
{
  return useSWRImmutable(cmd?["/preflight", cmd.hash]:null,  () => local_check(cmd, {signatureVerification:false, preflight:true}), {shouldRetryOnError:false});
}

function useLocalPact(code, network, chain, options)
{
  return useSWR((code && network && chain)?["/pact",code, network, chain]:null, x  => local_pact(x[1],x[2],x[3]), options );
}

function useLocalPactImmutable(code, network, chain)
{
  return useSWRImmutable((code && network && chain)?["/imm_pact",code, network, chain]:null, x  => local_pact(x[1],x[2],x[3]));
}

export {useSubmitResult, local_check, local_pact, useTrxDate, useTrxStatusImmutable, useLocalPact, useLocalPactImmutable, usePreflight, submit, status}
