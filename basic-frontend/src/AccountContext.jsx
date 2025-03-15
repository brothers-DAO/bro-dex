import { createContext, useState, useEffect, useCallback } from 'react';
import SignClient from '@walletconnect/sign-client'
import { WalletConnectModal } from '@walletconnect/modal'
import { useLocalStorage} from 'primereact/hooks';

import {useSingleKeyAccount} from './backend/tokens-react';

import { FloatLabel } from "primereact/floatlabel";
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { timeout} from 'promise-timeout';
import {signWithChainweaver, createEckoWalletQuicksign, createQuicksignWithWalletConnect} from '@kadena/client';

const NETWORK = import.meta.env.VITE_NETWORK;
const DEPLOYED_URL = import.meta.env.VITE_DEPLOYED_URL;

const ecko_quicksign = createEckoWalletQuicksign();

const AccountContext = createContext(null);

const WALLET_CONNECT_CHAIN_ID = `kadena:${NETWORK}`

const WALLET_CONNECT_META = {projectId: '58f7e24f7649cb4dcdc9184466eaf033',
                            logger:"silent",
                            metadata: { name: 'BRO DEX',
                                        description: "An orderbook based DEX",
                                        url: DEPLOYED_URL,
                                        icons: ['https://walletconnect.com/walletconnect-logo.png']
                                      }
                            }


const WALLET_CONNECT_NAMESPACE = {kadena: { chains: [WALLET_CONNECT_CHAIN_ID],
                                            methods: ["kadena_getAccounts_v1","kadena_quicksign_v1"
      ],
      "events": []
    }
  }

const walletConnectModal = new WalletConnectModal({projectId:'58f7e24f7649cb4dcdc9184466eaf033',
                                                   explorerRecommendedWalletIds: 'NONE',
                                                   themeMode:"dark"})

function AccountDialog({visible, onHide, onConfirm})
{
  const [_account, _setAccount] = useState("");

  return <Dialog header="Set Account" visible={visible} closable onShow={() => _setAccount("")} onHide={onHide}>
        Enter your Kadena account (usually starts with k:)
        <FloatLabel className="my-4">
          <InputText id="__acount" value={_account} onChange={(e) => _setAccount(e.target.value)} size={60}/>
          <label htmlFor="__acount">Account</label>
        </FloatLabel>
        <Button label="OK" icon="pi pi-check" onClick={()=>onConfirm(_account)} />

        </Dialog>
}

const WalletType  = {READ_ONLY:"RO", CHAINWEAVER:"CW", ECKO:"EW", WALLET_CONNECT:"WC"}

function useEckoWalletAccount(wallet, onFail)
{
  const [status, setStatus] = useState(null);

  useEffect( () => {  if(wallet== WalletType.ECKO)
                        ecko_quicksign.checkStatus(NETWORK).then(setStatus).catch(e => {console.log(e); onFail()});
                      else
                        setStatus(null);
                      }, [wallet, onFail])
  return status?.account?.account;
}


let clientInit = false;

const LinxShim = {
  get(target, prop, receiver)
  {
    if (prop === "request")
    {
      return async function (...args)
      {
        const result = await target[prop].apply(this, args);
        if(result?.results)
        {
          console.warn("Linx Bug Workaround")
          result.responses = result.results
        }
        return result;
      };
    }
    return Reflect.get(target, prop, receiver);
  }
};

function useWalletConnectClient(wallet)
{
  const [client, setClient] = useState(null)

  useEffect(() => { if(wallet== WalletType.WALLET_CONNECT && !clientInit)
                    {
                      clientInit = true;
                      console.log("Init WC Client")
                      SignClient.init(WALLET_CONNECT_META).then( x=> setClient(new Proxy(x, LinxShim)))
                    }}, [wallet])

  return wallet== WalletType.WALLET_CONNECT?client:null;

}

function useWalletConnectSession(client, onFail)
{
  const [session, _setSession] = useState(null);
  const [signer, setSigner] = useState(null);

  const setSession = useCallback(x => { if(x)
                                          setSigner(() => createQuicksignWithWalletConnect(client, x, WALLET_CONNECT_CHAIN_ID));
                                        else
                                          setSigner(null);
                                        _setSession(x);},[client])

  useEffect( () => {  if(client)
                      {
                        console.log("WC Connect")
                        const lastKeyIndex = client.session.getAll().length -1
                        if(lastKeyIndex >= 0)
                          setSession(client.session.getAll()[lastKeyIndex])
                        else
                          client.connect({requiredNamespaces:WALLET_CONNECT_NAMESPACE})
                          .then( ({uri, approval}) => {walletConnectModal.openModal({ uri }); return timeout(approval(), 120_000)})
                          .then(setSession)
                          .catch((e) => {console.warn(e); onFail()})
                         .finally( () => walletConnectModal.closeModal());
                      }
                      else
                        setSession(null)
                    }, [client, setSession, onFail])
  return {session, signer};
}


function parse_getAccounts_result(res)
{
  if(!res?.accounts?.[0])
    return null;
  return res.accounts[0].kadenaAccounts?.[0]?.name || "k:"+ res.accounts[0].publicKey;
}

function useWalletConnectAccount(client, session, onFail)
{
  const [account, setAccount] = useState(client, session)

  useEffect( () => {  if(client && session)
                      {
                        console.log("Retrieve WC account")
                        timeout(client.request({topic:session.topic,
                                        chainId: WALLET_CONNECT_CHAIN_ID,
                                        request: {method:"kadena_getAccounts_v1",
                                                  params: {accounts: [{account:session.namespaces.kadena.accounts[0], contract:"coin"}]}}})
                                ,10_000)
                        .then(res => {console.log(res); return res})
                        .then(parse_getAccounts_result)
                        .then(setAccount)
                        .catch((e) => {console.warn(e); client.disconnect({topic:session.topic}); onFail()});
                      }
                      else
                        setAccount(null)
                    }, [client, session, onFail])
  return account;
}




function AccountContextProvider({children})
{
  const [wallet, _setWallet] = useLocalStorage(null, 'wallet');
  // Used for Reaad-Only and Chwainweaver
  const [walletAccount, setWalletAccount] = useLocalStorage(null, 'wallet_account');

  // Intentionnaly, I removed the dependency _setWallet
  const resetWallet = useCallback(()=> _setWallet(null), []);

  const ecko_account = useEckoWalletAccount(wallet, resetWallet);

  const wc_client = useWalletConnectClient(wallet);
  const {session:wc_session, signer:wc_signer} = useWalletConnectSession(wc_client, resetWallet);
  const wc_account = useWalletConnectAccount(wc_client, wc_session, resetWallet);

  const setWallet = (w) => {setWalletAccount(null);
                            _setWallet(w)
                            if(w!=WalletType.WALLET_CONNECT && wc_client && wc_session)
                              wc_client.disconnect({topic:wc_session.topic});

                            if(w == WalletType.CHAINWEAVER ||  w == WalletType.READ_ONLY)
                              setShowAccountDialog(true);
                           };

  const [showAccountDialog, setShowAccountDialog] = useState(false)

  const account =  (wallet == WalletType.CHAINWEAVER ||  wallet == WalletType.READ_ONLY)?walletAccount
                  :(wallet == WalletType.ECKO?ecko_account
                  :(wallet == WalletType.WALLET_CONNECT?wc_account
                  :null))
  const signer =  wallet == WalletType.CHAINWEAVER?signWithChainweaver
                 :(wallet == WalletType.ECKO?ecko_quicksign
                 :(wallet == WalletType.WALLET_CONNECT?wc_signer
                 :null));

  const {key} = useSingleKeyAccount(account);

  return <AccountContext.Provider value={{account, key, signer, wallet, setWallet}} >
          <AccountDialog visible={showAccountDialog} onHide={()=>{setShowAccountDialog(false); resetWallet()}} onConfirm={(x) => {setWalletAccount(x);setShowAccountDialog(false)} } />
          {children}
         </AccountContext.Provider>

}

export {AccountContext, AccountContextProvider, WalletType};
