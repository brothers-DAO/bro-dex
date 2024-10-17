import {useState} from 'react';
import {Decimal} from 'decimals';

import { TabView, TabPanel } from 'primereact/tabview';
import { Panel } from 'primereact/panel';

import {usePairConfig} from './backend/bro-dex-react';
import {core_mod, wrapper_mod} from './backend/bro-dex-common'
import {useTokenInfo} from './backend/tokens_info';

import {AccountContextProvider} from './AccountContext';
import {TransactionContextProvider} from './TransactionContext';

import OrderBook from './Orderbook';
import Balances from './Balances';
import {GlobalHistory, AccountHistory, AccountActiveOrders} from './GlobalHistory';
import {MainBar} from './MainBar';
import {TradingPanel} from './Trading';
import {ModuleLink} from './Explorer'

import './App.css';

const PAIRS  = [{name:"BRO-KDA-R",
                 code: "BRO-KDA",
                 display_name:"BRO/KDA",
                 quote:"KDA",
                 quote_module:"coin",
                 base:"$BRO",
                 base_module:"n_5d119cc07ffd5efaef5c7feef9e878f34e3d4652.bro",
                 orderbook_precision:Decimal(1.0),
                 quote_decimals:1,
                 base_decimals:4 },
                {name:"BRO-ABC-R",
                 code: "BRO-ABC",
                 display_name:"BRO/ABC",
                 quote:"ABC",
                 quote_module:"n_ff0f76ee90735fba124eba93a1c49423c75654b1.abc",
                 base:"$BRO",
                 base_module:"n_5d119cc07ffd5efaef5c7feef9e878f34e3d4652.bro",
                 orderbook_precision:Decimal(10.0),
                 quote_decimals:1,
                 base_decimals:2 },
                ]

function CommonCard({title, toggleable=false, children})
{
  return <Panel toggleable={toggleable} collapsed={toggleable} header={title} className="shadow-3 m-2 border-round-top-md border-round-bottom-2xl" pt={{header:{className:"text-xl border-round-top-md justify-content-between"},
                                                                                                                      content:{className:"border-round-bottom-2xl py-3"}}}>
            {children}
          </Panel>
}

function OrderBookCard({pair, onClick})
{
  return <CommonCard title="Orderbook" pt={{content:{className:"py-0"}}}>
    <OrderBook pair={pair} onClick={onClick}/>
  </CommonCard>
}

function HistoryCard({pair})
{
  return <CommonCard title="History" pt={{content:{className:"py-0"}}}>
    <GlobalHistory pair={pair} />
  </CommonCard>
}

function AccountCard({pair})
{
  return <CommonCard title="Account activity">
         <TabView >
          <TabPanel header="Active orders">
            <AccountActiveOrders pair={pair}/>
          </TabPanel>
          <TabPanel header="History">
            <AccountHistory pair={pair} />
          </TabPanel>
        </TabView>

  </CommonCard>
}

function PairIcon({pair})
{
  const {token_info:base_info} = useTokenInfo(pair.base_module);
  const {token_info:quote_info} = useTokenInfo(pair.quote_module);

  if(base_info && quote_info)
    return <div className="flex justify-content-center w-min"><img src={base_info.img} className="z-1 w-2rem relative" />  <img src={quote_info.img} className="w-2rem relative" style={{left:"-1rem"}} />  </div>
  else
    return <></>

}

function PairInfoCard({pair})
{
  const config = usePairConfig(pair.name);

  return <CommonCard title="Pair Info" toggleable>
            <ul className="line-height-2 m-0">
            <li> <span className="font-bold">Network:</span> {import.meta.env.VITE_NETWORK} </li>

            <li> <span className="font-bold">Chain:</span>  {import.meta.env.VITE_CHAIN} </li>

            <li> <span className="font-bold">Module:</span>  {core_mod(pair.name)} <ModuleLink module={core_mod(pair.name)} /> </li>

            <li> <span className="font-bold">Wrapper:</span>  {wrapper_mod(pair.name)} <ModuleLink module={wrapper_mod(pair.name)} /> </li>

            {config?.deposit_account && <li> <span className="font-bold">Deposit account:</span>  {config.deposit_account} </li>}

            <li> <span className="font-bold">Base:</span>  {pair.base_module} <ModuleLink module={pair.base_module} />< /li>

            <li> <span className="font-bold">Quote:</span>  {pair.quote_module} <ModuleLink module={pair.quote_module} /> </li>

            <li> <span className="font-bold">Maker fee:</span>  0 % </li>

            {config?.fee_ratio  && <li> <span className="font-bold">Taker fee:</span>  {config.fee_ratio.mul(100).toString()} % </li>}

            {config?.min_amount  && <li> <span className="font-bold">Minimum amount (Qty):</span> {config.min_amount.toString()} {pair.base}</li>}

            {config?.max_amount  && <li> <span className="font-bold">Maximum amount (Qty):</span> {config.max_amount.toString()} {pair.base}</li>}

            {config?.min_price  && <li> <span className="font-bold">Minimum price:</span> {config.min_price.toString()} {pair.quote}</li>}

            {config?.max_price  && <li> <span className="font-bold">Maximum price:</span> {config.max_price.toString()} {pair.quote}</li>}



            </ul>
        </CommonCard>

}

function TradingCard({pair, preSelectedOrder})
{
  return <CommonCard title="Trading">
          <Balances pair={pair} />
          <TradingPanel pair={pair} preSelectedOrder={preSelectedOrder}/>
        </CommonCard>
}

function PairPanel({pair})
{
  const [lastClickedOrder, setLastClickedOrder] = useState(null)
  return  <div className="flex flex-column max-w-max">
            <PairInfoCard pair={pair} />
          <div className="flex flex-row flex-wrap">

          <div className="flex flex-column min-w-min">
            <OrderBookCard pair={pair} onClick={x => setLastClickedOrder(x)}/>
            <HistoryCard  pair={pair}/>
          </div>

          <div className="flex flex-column">
            <TradingCard pair={pair} preSelectedOrder={lastClickedOrder}/>
            <AccountCard pair={pair}/>
          </div>
        </div>
      </div>
}

function GlobalDex()
{
  return <TabView>
          {PAIRS.map( (p)=><TabPanel key={p.name} header={<div className="flex flex-row align-items-center gap-1" > {p.display_name} <PairIcon pair={p} /></div>}><PairPanel pair={p}/></TabPanel>)}
        </TabView>

}

function App()
{
  return  <AccountContextProvider>
            <TransactionContextProvider>
              <MainBar />
              <GlobalDex />

            </TransactionContextProvider>
          </AccountContextProvider>
}

export default App;