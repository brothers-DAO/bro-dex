import { createContext, useState, useRef, useEffect} from 'react';
import useSWRImmutable from 'swr/immutable'

import {signWithChainweaver} from '@kadena/client';

import {usePreflight, useSubmitResult, useTrxStatusImmutable} from './backend/pact';

import { Toast } from 'primereact/toast';

const TransactionContext = createContext(null);

function TransactionContextProvider({children})
{
  const toast = useRef(null);
  const [trx, setTrx] = useState(null)
  const [trxCount, setTrxCount] = useState(0)
  const {data:pf_result, error:pf_error} = usePreflight(trx);
  const {data:sig_result, error:sig_error} = useSWRImmutable((trx && pf_result!=null && !pf_error)?trx:null,
                                                             (t)=> signWithChainweaver(t), {shouldRetryOnError:false})

  const {data:submit_result, error:submit_error} = useSubmitResult(sig_result);
  const {data:poll_result, error:poll_error} = useTrxStatusImmutable(submit_result, true);


  useEffect( ()=> { if(pf_result!=null)
                    {
                      toast.current.show({ severity: 'success', summary: 'Preflight', detail: 'Preflight result:' + pf_result.toString(), life: 3000 });
                      setTimeout(() => toast.current.show({ severity: 'info', summary: 'Wallet', detail: 'Wating for wallet signature', life:180000 }), 200);
                      //toast.current.show({ severity: 'info', summary: 'Wallet', detail: 'Wating for wallet signature', life:180000 })
                    }
                    else if(pf_error)
                      toast.current.show({ severity: 'error', summary: 'Preflight', detail: 'Preflight result:' + pf_error.toString(), life: 3000 });
                  }, [pf_result, pf_error])

  useEffect( () => {if(sig_result)
                      toast.current.replace({ severity: 'success', summary: 'Wallet', detail: 'Wallet Signature OK', life:10000 });
                    else if(sig_error)
                      setTimeout(() => toast.current.show({ severity: 'error', summary: 'Wallet', detail: 'Wallet Signature Error', life:10000 }), 1000);
                    }, [sig_result, sig_error])

  useEffect( () => {if(submit_result)
                      toast.current.show({ severity: 'success', summary: 'Submit', detail: 'Transaction submitted to the network: '+submit_result.requestKey, life:500000 });
                    else if(submit_error)
                      toast.current.show({ severity: 'error', summary: 'Submit', detail: 'TransactionSubmit Error', life:10000 });
                    }, [submit_result, submit_error])

  useEffect( () => {if(poll_result)
                    {
                      toast.current.replace({ severity: 'success', summary: 'Submit', detail: 'Transaction confirmed: '+poll_result.reqKey, life:180_000 });
                      setTrxCount(x=>x+1)
                    }
                    else if(poll_error)
                      toast.current.replace({ severity: 'error', summary: 'Submit', detail: 'Transaction Error: ' + poll_error.toString(), life:180_000 });

                    }, [poll_result, poll_error])

  return <TransactionContext.Provider value={{setTrx, trxCount}} >
          <Toast ref={toast} position="top-left"/>
          {children}
         </TransactionContext.Provider>

}

export {TransactionContext, TransactionContextProvider};
