import {useContext, useEffect, useRef} from 'react';
import {useTokensBalance} from './backend/tokens-react';
import { Card } from 'primereact/card';
import { OverlayPanel } from 'primereact/overlaypanel';
import { TransactionContext} from './TransactionContext';

import { AccountContext} from './AccountContext';
import {AccountLink} from './Explorer'
import {useTokenInfo} from './backend/tokens_info';

const SOCIAL_ICONS = {website:"pi-globe", twitter:"pi-twitter", discord:"pi-discord", github:"pi-github", telegram:"pi-telegram"}

function SocialLink({lnk})
{
  const icon = SOCIAL_ICONS[lnk.type] || "pi-external-link";
  return <a href={lnk.url} style={{ fontSize: '1rem' }} target="_blank" rel="noopener noreferrer" className={"no-underline pi " + icon}/>
}

function TokenInfoIcon({module})
{
  const {token_info} = useTokenInfo(module);
  const op = useRef(null);
  return  <>
          {token_info && <img src={token_info.img} className="w-5rem cursor-pointer"  onClick={(e) =>op.current.toggle(e)}/> }
          <OverlayPanel ref={op} className="order-1 shadow-8 border-1">
            {token_info &&  <div className="flex flex-column">
                              <div className="flex flex-row ">
                                <img src={token_info.img} className="w-3rem"/>
                                <div className="flex-grow-1 text-center text-3xl align-content-center font-bold">{token_info.name}</div>
                              </div>
                              <div className="m-2 font-italic" > {token_info.description} </div>
                              <div className="m-2 flex flex-column gap-1" >
                                <div> <span className="font-bold vertical-align-middle">Module:</span> <span className="text-xs vertical-align-middle"> {module}</span></div>
                                {token_info?.totalSupply && <div> <span className="font-bold">Total supply:</span> {token_info.totalSupply.toString()}</div>}
                                {token_info?.circulatingSupply && <div> <span className="font-bold">Circulating supply:</span> {token_info.circulatingSupply.toString()}</div>}
                                {token_info?.socials && <div className="flex flex-row gap-2"> <span className="font-bold">Links:</span>  {token_info.socials.map( (x,i) => <SocialLink key={i} lnk={x}/>)} </div>}
                              </div>
                            </div>

            }
          </OverlayPanel>
          </>
}

function Balances({pair})
{
  const {account} = useContext(AccountContext);
  const {trxCount} = useContext(TransactionContext);
  const {balances:[balance_a, balance_b], mutate} = useTokensBalance(account, pair.quote_module, pair.base_module);

  useEffect(() => {if(trxCount)
                    mutate();},
           [trxCount, mutate]);

  return <>
          <div className="font-bold text-primary text-center mb-1"> Balances </div>
          <div className="flex flew-row gap-3 text-center justify-content-center align-items-center">
          <TokenInfoIcon module={pair.base_module} />
          <Card title={<div className="flex gap-1 justify-content-center"> {pair.base}<AccountLink account={account} fungible={pair.base_module} /> </div>} className="w-7rem border-2 border-round-lg shadow-4 border-green-600" pt={{body:{className:"p-1"}}} >
            {balance_b?balance_b.toFixed(pair.base_decimals):"~"}
          </Card>

          <Card title={<div className="flex gap-1 justify-content-center"> {pair.quote}<AccountLink account={account} fungible={pair.quote_module} /> </div>} className="w-7rem border-2 border-round-lg shadow-4 border-red-600" pt={{body:{className:"p-1"}}}>
            {balance_a?balance_a.toFixed(pair.quote_decimals):"~"}
          </Card>
          <TokenInfoIcon module={pair.quote_module} />
        </div>
        </>
}

export default Balances

export {TokenInfoIcon}
