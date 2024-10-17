import {useContext, useEffect} from 'react';
import {useTokensBalance} from './backend/tokens-react';
import { Card } from 'primereact/card';
import { TransactionContext} from './TransactionContext';
import { AccountContext} from './AccountContext';
import {AccountLink} from './Explorer'
import {useTokenInfo} from './backend/tokens_info';

function Balances({pair})
{
  const {account} = useContext(AccountContext);
  const {trxCount} = useContext(TransactionContext);
  const {balance_a, balance_b, mutate} = useTokensBalance(account, pair.quote_module, pair.base_module);
  const {token_info:base_info} = useTokenInfo(pair.base_module);
  const {token_info:quote_info} = useTokenInfo(pair.quote_module);

  useEffect(() => {if(trxCount){console.log("Trigger mutation");mutate()}}, [trxCount, mutate])

  return <>
          <div className="font-bold text-primary text-center mb-1"> Balances </div>
          <div className="flex flew-row gap-3 text-center justify-content-center align-items-center">
          {base_info && <img src={base_info.img} className="w-5rem"/> }
          <Card title={<div className="flex gap-1 justify-content-center"> {pair.base}<AccountLink account={account} fungible={pair.base_module} /> </div>} className="w-7rem border-2 border-round-lg shadow-4 border-green-600" pt={{body:{className:"p-1"}}} >
            {balance_b.toFixed(pair.base_decimals)}
          </Card>

          <Card title={<div className="flex gap-1 justify-content-center"> {pair.quote}<AccountLink account={account} fungible={pair.quote_module} /> </div>} className="w-7rem border-2 border-round-lg shadow-4 border-red-600" pt={{body:{className:"p-1"}}}>
            {balance_a.toFixed(pair.quote_decimals)}
          </Card>
          {quote_info && <img src={quote_info.img} className="w-5rem"/> }
        </div>
        </>
}

export default Balances
