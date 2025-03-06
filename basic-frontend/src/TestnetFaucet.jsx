import {Decimal} from 'decimal.js';
import {useContext, useState, useEffect, useRef} from 'react';
import {AccountContext} from './AccountContext';
import { Card } from 'primereact/card';
import {TokenInfoIcon} from './Balances';
import {AccountLink} from './Explorer'
import {useTokensBalance} from './backend/tokens-react';

import { Button } from 'primereact/button';

import _COINS_LIST from '../faucet.json';

const COINS_LIST = _COINS_LIST.map(x => ({...x, amount:Decimal(x.amount)}))


function TestnetFaucet ()
{
  const {account} = useContext(AccountContext);
  const {balances} = useTokensBalance(account, ...COINS_LIST.map(x => x.mod));

  return  <div className="flex flex-column">
            <div className="flex justify-content-evenly">
              {COINS_LIST.map((x, i) => <div className="flex flex-column text-center">
                                        <div><TokenInfoIcon module={x.mod} /></div>
                                        <div className="text-center text-8xl" > ⤓ </div>
                                        <div className="text-center text-xl" > {x.amount.toFixed(2)} </div>
                                        <div className=" text-center text-8xl" > ↧ </div>
                                        <Card title={<div className="flex gap-1 justify-content-center"> {x.name}<AccountLink account={account} fungible={x.mod} /> </div>} className="w-7rem border-2 border-round-lg shadow-4 border-blue-600" pt={{body:{className:"p-1"}}} >
                                          {balances[i]?balances[i].toFixed(2):"~"}
                                        </Card>

                                  </div>)}

            </div>
          <div className="flex justify-content-center m-2"><Button className="w-10 text-center" label=" --> Retrieve coins <--"/></div>
          </div>
}

export default TestnetFaucet
