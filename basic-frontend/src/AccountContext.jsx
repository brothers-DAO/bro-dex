import { createContext, useState } from 'react';
import { useLocalStorage } from 'primereact/hooks';
import {useSingleKeyAccount} from './backend/tokens-react';
const AccountContext = createContext(null);

function AccountContextProvider({children})
{
  const [account, setAccount] = useLocalStorage(null, 'account')
  const [wallet, setWallet] = useState("CHAINWEAVER")
  const {key} = useSingleKeyAccount(account);

  return <AccountContext.Provider value={{account, key, wallet, setAccount}} >
          {children}
         </AccountContext.Provider>

}

export {AccountContext, AccountContextProvider};
