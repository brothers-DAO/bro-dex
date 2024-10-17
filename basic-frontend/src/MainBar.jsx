import { Toolbar } from 'primereact/toolbar';
import { useState, useContext } from 'react';
import {AccountContext} from './AccountContext';
import { SplitButton } from 'primereact/splitbutton';
import { FloatLabel } from "primereact/floatlabel";
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';



function AccountDialog({visible, onHide})
{
  const [_account, _setAccount] = useState("");
  const {setAccount} = useContext(AccountContext);

  return <Dialog header="Set Account" visible={visible} closable onShow={() => _setAccount("")} onHide={onHide}>
        Enter your Kadena account (usually starts with k:)
        <FloatLabel className="my-4">
          <InputText id="__acount" value={_account} onChange={(e) => _setAccount(e.target.value)} size={50}/>
          <label htmlFor="__acount">Account</label>
        </FloatLabel>
        <Button label="OK" icon="pi pi-check" onClick={()=>{setAccount(_account), onHide()}} />

        </Dialog>
}

function AccountMenu ()
{
  const {account, setAccount} = useContext(AccountContext);
  const [showAccountDialog, setShowAccountDialog] = useState(false)
  console.log(showAccountDialog)

  if(account)
  {
      const items = [
      {
          label: 'Disconnect',
          icon: 'pi pi-refresh',
          command: ()=> setAccount(null)

      }
    ];
    return <SplitButton label={account.substring(0,10) + "..."} rounded raised model={items} icon="pi pi-check"></SplitButton>
  }
  else
  {
      const items = [
      {
          label: 'Chainweaver',
          icon: 'pi pi-refresh',
          command: ()=>setShowAccountDialog(true)
      },
      {
          label: 'Ecko-Wallet',
          icon: 'pi pi-refresh'
      },

      {
          label: 'WalletCoonect',
          icon: 'pi pi-refresh'
      }
    ];
    return  <>
              <AccountDialog visible={showAccountDialog} onHide={()=>setShowAccountDialog(false)} />
              <SplitButton label="Connect Wallet" model={items} rounded raised icon="pi pi-check"></SplitButton>
            </>
  }
}


export function MainBar()
{
  return <Toolbar center={<span className="font-bold text-2xl">Bro DEX</span>} end={<AccountMenu />} />
}
