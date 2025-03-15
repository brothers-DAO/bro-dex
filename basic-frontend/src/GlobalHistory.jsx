import { useState, useContext, useEffect } from 'react';
import { Decimal } from 'decimal.js';

import {useHistory, useAccountHistory, useActiveMakerTransactions} from './backend/bro-dex-react'
import {make_cancel_order} from './backend/bro-dex-transactions';

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import {TransactionContext} from './TransactionContext';
import {AccountContext} from './AccountContext';
import OrderDialog from './OrderDialog'


const short_id = x => x.toString().substring(0,5)+ "..."

const dir_icon = (ask, canceled=false) =>
  {
    if(canceled)
      return <i className="pi pi-times" style={{ color: 'black' }} />
    else if(ask)
      return <i className="pi pi-sort-up-fill" style={{ color: 'green' }} />
    else
      return <i className="pi pi-sort-down-fill" style={{ color: 'red' }} / >
  }

const Currency = ({name}) => <span className="text-sm font-italic">{name}</span>

const Price = ({pair, val}) => <> {val.toFixed(pair.quote_decimals)} <Currency name={pair.quote} /> </>

const Amount = ({pair, val}) => <> {val.toFixed(pair.base_decimals, Decimal.ROUND_UP)} <Currency name={pair.base} /> </>



function GlobalHistory({pair})
{
  const {trxCount} = useContext(TransactionContext);
  const {data, mutate, setSize, totalSize} = useHistory(pair.name);
  const [clickedOrder, setClickedOrder] = useState(null);
  const [first, setFirst] = useState(0);

  useEffect(() => {if(trxCount){mutate()}}, [trxCount, mutate])

  const onPage =  (e) => { setFirst(e.first);
                           setSize(e.first+10);}


  return <> {clickedOrder && <OrderDialog pair={pair} order={clickedOrder} onClose={() => setClickedOrder(null)} />}
            <DataTable className="w-30rem" lazy totalRecords={totalSize} value={data.slice(first)} first={first} onPage={onPage} paginator rows={10} emptyMessage="No data" dataKey="id"  stripedRows selectionMode="single" onRowClick={x=> setClickedOrder(x.data)} >
              <Column header="" body={x=>dir_icon(x.is_ask)} />
              <Column header="ID" body={x=> short_id(x.id)} />


              <Column header="Price" body={x=> <Price pair={pair} val={x.price}/>} />
              <Column header="Amount" body={x=> <Amount pair={pair} val={x.amount}/>} />
            </DataTable>
          </>

}

function AccountHistory({pair})
{
  const {trxCount} = useContext(TransactionContext);
  const {account} = useContext(AccountContext);
  const {data, mutate, setSize, totalSize} = useAccountHistory(pair.name, account);
  const [clickedOrder, setClickedOrder] = useState(null);
  const [first, setFirst] = useState(0);

  useEffect(() => {if(trxCount){mutate()}}, [trxCount,mutate])

  const onPage =  (e) => { setFirst(e.first);
                           setSize(e.first+10);}

  return <> {clickedOrder && <OrderDialog pair={pair} order={clickedOrder} onClose={() => setClickedOrder(null)} />}
            <DataTable className="w-30rem" lazy totalRecords={totalSize} value={data.slice(first)} first={first} onPage={onPage} paginator rows={10} emptyMessage="No data" dataKey="id"  stripedRows selectionMode="single" onRowClick={x=> setClickedOrder(x.data)} >
              <Column header="" body={x=>dir_icon(x.is_ask, x.state==3)} />
              <Column header="ID" body={x=> short_id(x.id)} />
              <Column header="Price" body={x=> <Price pair={pair} val={x.price}/>} />
              <Column header="Amount" body={x=> <Amount pair={pair} val={x.amount}/>} />
            </DataTable>
          </>
}

function AccountActiveOrders({pair})
{
  const {trxCount} = useContext(TransactionContext);
  const {account, key} = useContext(AccountContext);
  const {setTrx} = useContext(TransactionContext);

  const {data, mutate} = useActiveMakerTransactions(pair.name, account);
  const [clickedOrder, setClickedOrder] = useState(null);

  useEffect(() => {if(trxCount){mutate()}}, [trxCount, mutate])

  const onCancel = (order) =>
    {setTrx(make_cancel_order(pair, account, key, order))}

  return <> {clickedOrder && <OrderDialog pair={pair} order={clickedOrder} onCancel={onCancel} onClose={() => setClickedOrder(null)} />}
            <DataTable emptyMessage="No active orders" dataKey="id" value={data} stripedRows selectionMode="single" onRowClick={x=> setClickedOrder(x.data)} >
              <Column header="ID" body={x=> short_id(x.id)} />
              <Column header="Type" body={x => x.is_ask?"Sell":"Buy"} />
              <Column header="Price" body={x=> <Price pair={pair} val={x.price}/>} />
              <Column header="Amount" body={x=> <Amount pair={pair} val={x.amount}/>} />
            </DataTable>
          </>
}


export {GlobalHistory, AccountHistory, AccountActiveOrders}
