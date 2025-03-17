import { Toolbar } from 'primereact/toolbar';
import {useContext } from 'react';
import {AccountContext, WalletType} from './AccountContext';
import { SplitButton } from 'primereact/splitbutton';
import WalletConnectIcon from './img/WalletConnect-icon.svg'
import ChainWeaverIcon from './img/chainweaver-icon.png'
import EckoIcon from './img/ecko-wallet-icon.svg'
import { ProgressSpinner } from 'primereact/progressspinner';
import AboutButton from './AboutButton';

const ICONS = {RO:'pi pi-eye',
               CW:<img style={{width: "1.25em", margin:"2px"}} src={ChainWeaverIcon} />,
               EW:<img style={{width: "1.25em", height:"1.25em", margin:"2px"}} src={EckoIcon} />,
               WC:<img style={{width: "1.25em", margin:"2px"}} src={WalletConnectIcon} />,}


function AccountMenu ()
{
  const {account, wallet, setWallet} = useContext(AccountContext);

  if(wallet)
  {
      const items = [
      {
          label: 'Disconnect',
          icon: 'pi pi-sign-out',
          command: ()=> setWallet(null)

      }
    ];
    const label = account?account.substring(0,12) + "...":<>Connecting <ProgressSpinner style={{width: '1em', height: '1em', position: "relative", top:"0.2em"}} strokeWidth="8" /></>;
    return <SplitButton label={label} rounded raised model={items} icon={ICONS[wallet]}></SplitButton>
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
    return <SplitButton label="Connect Wallet" model={items} rounded raised icon="pi pi-wallet" />
  }
}


export function MainBar()
{
  return <Toolbar className="border-round-md shadow-1" start={<AboutButton/>} center={<div className="flex flex-column align-items-center -m-3"><div className="ribeye-regular text-center font-bold text-5xl -m-1">Bro deX</div> <div className=" text-center">The 1st Orderbook based DEX on Kadena</div></div>} end={<AccountMenu />} />
}
