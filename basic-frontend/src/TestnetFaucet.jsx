import {useContext, useEffect} from 'react';
import {AccountContext} from './AccountContext';
import {TransactionContext} from './TransactionContext';
import { Card } from 'primereact/card';
import {TokenInfoIcon} from './Balances';
import {AccountLink} from './Explorer'
import {useTokensBalance} from './backend/tokens-react';
import {useFaucetDetails} from './backend/faucet-react';
import {retrieve_coins} from './backend/faucet-transactions';

import { Button } from 'primereact/button';


function TestnetFaucet ()
{
  const {account, key} = useContext(AccountContext);
  const {setTrx, trxCount} = useContext(TransactionContext);
  const {gas_station, details} = useFaucetDetails();
  const {balances, mutate} = useTokensBalance(account, ... (details ?? []).map(x => x.fungible));

  useEffect(() => {if(trxCount){console.log("Trigger mutation");mutate()}}, [trxCount, mutate])

  const onSubmit = () => setTrx(retrieve_coins(account, key, gas_station))

  return  <div className="flex flex-column">
            <div className="flex justify-content-evenly">
              {details && details.map((x, i) => <div key={i.toString()} className="flex flex-column text-center">
                                        <div><TokenInfoIcon module={x.fungible} /></div>
                                        <div className="text-center text-8xl" > ⤓ </div>
                                        <div className="text-center text-xl" > {x.amount.toFixed(2)} </div>
                                        <div className=" text-center text-8xl" > ↧ </div>
                                        <Card title={<div className="flex gap-1 justify-content-center"> {x.short_name} <AccountLink account={account} fungible={x.fungible} /> </div>} className="w-7rem border-2 border-round-lg shadow-4 border-blue-600" pt={{body:{className:"p-1"}}} >
                                          {balances[i]?balances[i].toFixed(2):"~"}
                                        </Card>

                                  </div>)}

            </div>
          {gas_station && <div className="flex justify-content-center m-2"><Button onClick={onSubmit} disabled={!account || !key } className="w-10 text-center shadow-3" label=" --> Retrieve coins <--"/></div>}
          </div>
}

export default TestnetFaucet
