import { createContext, useState, useEffect } from 'react';

import { useLocalStorage} from 'primereact/hooks';

import {useSingleKeyAccount} from './backend/tokens-react';

import { FloatLabel } from "primereact/floatlabel";
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';

import {signWithChainweaver, createEckoWalletQuicksign} from '@kadena/client';

const NETWORK = import.meta.env.VITE_NETWORK;

const ecko_quicksign = createEckoWalletQuicksign();

const AccountContext = createContext(null);


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

function useEckoWalletAccount(wallet)
{
  const [status, setStatus] = useState(null);

  useEffect( () => {  if(wallet== WalletType.ECKO)
                        ecko_quicksign.checkStatus(NETWORK).then(setStatus).catch(e => console.log(e));
                      else
                        setStatus(null);
                      }, [wallet])
  return status?.account?.account;
}



function AccountContextProvider({children})
{
  const [wallet, _setWallet] = useLocalStorage(null, 'wallet');
  // Used for Reaad-Only and Chwainweaver
  const [walletAccount, setWalletAccount] = useLocalStorage(null, 'wallet_account');
  // Used for temporary accounts

  const ecko_account = useEckoWalletAccount(wallet);

  const [showAccountDialog, setShowAccountDialog] = useState(false)

  const account =  (wallet == WalletType.CHAINWEAVER ||  wallet == WalletType.READ_ONLY)?walletAccount
                  :(wallet == WalletType.ECKO?ecko_account
                  :null)
  const signer =  wallet == WalletType.CHAINWEAVER?signWithChainweaver
                 :(wallet == WalletType.ECKO?ecko_quicksign
                 :null);

  const {key} = useSingleKeyAccount(account);


  const setWallet = (w) => {
    setWalletAccount(null);
    _setWallet(w)
    switch(w)
    {
      case WalletType.READ_ONLY:
      case WalletType.CHAINWEAVER:
        setShowAccountDialog(true);
        break;
    }

  }


  return <AccountContext.Provider value={{account, key, signer, wallet, setWallet}} >
          <AccountDialog visible={showAccountDialog} onHide={()=>setShowAccountDialog(false)} onConfirm={(x) => {setWalletAccount(x);setShowAccountDialog(false)} } />
          {children}
         </AccountContext.Provider>

}

export {AccountContext, AccountContextProvider, WalletType};
