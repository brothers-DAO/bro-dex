import { Toolbar } from 'primereact/toolbar';
import {useContext } from 'react';
import {AccountContext, WalletType} from './AccountContext';
import { SplitButton } from 'primereact/splitbutton';
import WalletConnectIcon from './img/WalletConnect-icon.svg'
import ChainWeaverIcon from './img/chainweaver-icon.png'
import EckoIcon from './img/ecko-wallet-icon.svg'


const ICONS = {RO:'pi pi-eye',
               CW:<img style={{width: "1.25em", margin:"2px"}} src={ChainWeaverIcon} />,
               EW:<img style={{width: "1.25em", height:"1.25em", margin:"2px"}} src={EckoIcon} />,
               WC:<img style={{width: "1.25em", margin:"2px"}} src={WalletConnectIcon} />,}


function AccountMenu ()
{
  const {account, wallet, setWallet} = useContext(AccountContext);
  console.log(wallet)
  console.log(ICONS[wallet])
  if(account)
  {
      const items = [
      {
          label: 'Disconnect',
          icon: 'pi pi-sign-out',
          command: ()=> setWallet(null)

      }
    ];
    return <SplitButton label={account.substring(0,12) + "..."} rounded raised model={items} icon={ICONS[wallet]}></SplitButton>
  }
  else
  {
      const items = [
      {
          label: 'Read-Only',
          icon:  'pi pi-eye',
          command: ()=>{setWallet(WalletType.READ_ONLY)}
      },

      {
          label: 'Chainweaver',
          icon:  (<img style={{width: "1.5em", marginRight:"0.2em"}} src={ChainWeaverIcon} />),
          command: ()=>{setWallet(WalletType.CHAINWEAVER)}
      },
      {
          label: 'Ecko-Wallet',
          icon: (<img style={{width: "1.5em", height:"1.5em", marginRight:"0.2em"}} src={EckoIcon} />),
          command: ()=>{setWallet(WalletType.ECKO)}
      },

      {
          label: 'WalletConnect',
          icon: (<img style={{width: "1.5em", marginRight:"0.2em"}} src={WalletConnectIcon} />),
          command: ()=>{setWallet(WalletType.WALLET_CONNECT)}
      }
    ];
    return  <>

              <SplitButton label="Connect Wallet" model={items} rounded raised icon="pi pi-wallet"></SplitButton>
            </>
  }
}


export function MainBar()
{
  return <Toolbar center={<span className="font-bold text-2xl">Bro DEX</span>} end={<AccountMenu />} />
}
