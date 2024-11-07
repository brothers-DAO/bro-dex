import { createContext, useContext, useState, useRef, useEffect} from 'react';
import useSWRImmutable from 'swr/immutable'

import {AccountContext} from './AccountContext';
import {usePreflight, useSubmitResult, useTrxStatusImmutable} from './backend/pact';

import { Toast } from 'primereact/toast';

const TransactionContext = createContext(null);

const WAITING_FOR_WALLET_MSG = { severity: 'info', summary: 'Wallet', detail: 'Wating for wallet signature', life:180000 }
const WALLET_SIGNATURE_OK_MSG = { severity: 'success', summary: 'Wallet', detail: 'Wallet Signature OK', life:10000 }
const WALLET_SIGNATURE_ERROR_MSG = { severity: 'error', summary: 'Wallet', detail: 'Wallet Signature Error', life:10000 }
const TRANSACTION_SUBMIT_ERROR_MSG = { severity: 'error', summary: 'Submit', detail: 'TransactionSubmit Error', life:10000 }

const pf_result_success_msg = (_pf_result) => ({ severity: 'success', summary: 'Preflight', detail: 'Preflight result:' + _pf_result?.toString(), life: 3000 })
const pf_result_fail_msg = (_pf_error) => ({ severity: 'error', summary: 'Preflight', detail: 'Preflight result:' + _pf_error?.toString(), life: 3000 })
const transaction_submitted_msg = (_submit_result) => ({ severity: 'success', summary: 'Submit', detail: 'Transaction submitted to the network: '+ _submit_result?.requestKey?.toString(), life:500000 })
const transaction_confirmed_msg = (_poll_result) => ({ severity: 'success', summary: 'Submit', detail: 'Transaction confirmed: '+ _poll_result?.reqKey, life:500000 })
const transaction_error_msg = (_poll_error) => ({ severity: 'success', summary: 'Submit', detail: 'Transaction error: '+ _poll_error?.toString(), life:500000 })

function TransactionContextProvider({children})
{
  const toast = useRef(null);
  const {signer} = useContext(AccountContext)
  const [trx, setTrx] = useState(null)
  const [trxCount, setTrxCount] = useState(0)
  const {data:pf_result, error:pf_error} = usePreflight(trx);
  const {data:sig_result, error:sig_error} = useSWRImmutable((trx && pf_result!=null && !pf_error)?trx:null,
                                                             (t)=> signer(t), {shouldRetryOnError:false})

  const {data:submit_result, error:submit_error} = useSubmitResult(sig_result);
  const {data:poll_result, error:poll_error} = useTrxStatusImmutable(submit_result, true);



  useEffect( () => toast.current.clear(), [trx])

  useEffect( ()=> { if(pf_result!=null)
                    {
                      toast.current.show(pf_result_success_msg(pf_result));
                      setTimeout(() => toast.current.show(WAITING_FOR_WALLET_MSG), 1000);
                    }
                    else if(pf_error)
                        toast.current.show(pf_result_fail_msg(pf_error));
                  }, [pf_result, pf_error])

  useEffect( () => {if(sig_result)
                      toast.current.show(WALLET_SIGNATURE_OK_MSG);
                    else if(sig_error)
                      toast.current.show(WALLET_SIGNATURE_ERROR_MSG);
                    setTimeout(()=> toast.current.remove(WAITING_FOR_WALLET_MSG), 1000)
                    }, [sig_result, sig_error])

  useEffect( () => {if(submit_result)
                      toast.current.show(transaction_submitted_msg(submit_result));
                    else if(submit_error)
                      toast.current.show(TRANSACTION_SUBMIT_ERROR_MSG);
                    setTimeout( ()=> toast.current.remove(WALLET_SIGNATURE_OK_MSG), 3_000)
                    }, [submit_result, submit_error])

  useEffect( () => {if(poll_result)
                    {
                      toast.current.show(transaction_confirmed_msg(poll_result));
                      console.log("Confirmed")
                      setTimeout( () => toast.current.remove(transaction_submitted_msg(submit_result)), 1_500)
                      setTrxCount(x=>x+1);
                    }
                    else if(poll_error)
                    {
                      toast.current.show(transaction_error_msg(poll_error));
                      setTimeout( () => toast.current.remove(transaction_submitted_msg(submit_result)), 1_500)
                    }

                    }, [poll_result, poll_error, submit_result])

  return <TransactionContext.Provider value={{setTrx, trxCount}} >
          <Toast ref={toast} position="top-left"/>
          {children}
         </TransactionContext.Provider>

}

export {TransactionContext, TransactionContextProvider};
