import { useState, useContext, useEffect } from 'react';
import { Decimal } from 'decimal.js';

import {usePairConfig, useHistory, useAccountHistory, useActiveMakerTransactions} from './backend/bro-dex-react'
import {ZERO} from './backend/utils'
import {make_order_account} from './backend/bro-dex-common'
import {useTrxDate} from './backend/pact';
import {make_cancel_order} from './backend/bro-dex-transactions';

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Divider } from 'primereact/divider';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';

import {TransactionContext} from './TransactionContext';
import {AccountContext} from './AccountContext';
import {TransactionLink, AccountTransferLink} from './Explorer'

const NETWORK = import.meta.env.VITE_NETWORK
const CHAIN = import.meta.env.VITE_CHAIN

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

const DirectionIcon = ({order}) => dir_icon(order?.is_ask)

const Currency = ({name}) => <span className="text-sm font-italic">{name}</span>

const Price = ({pair, val}) => <> {val.toFixed(pair.quote_decimals)} <Currency name={pair.quote} /> </>

const Amount = ({pair, val}) => <> {val.toFixed(pair.base_decimals, Decimal.ROUND_UP)} <Currency name={pair.base} /> </>



function OrderDialog({pair, onClose, order, onCancel})
{
  const {account} = useContext(AccountContext);
  const tx_date = useTrxDate(order.take_tx, NETWORK, CHAIN)
  const {fee_ratio} = usePairConfig(pair.name);
  const fee = fee_ratio ? (order.is_ask?order.amount.mul(order.price).mul(fee_ratio):order.amount.mul(fee_ratio))
                        : ZERO;
  const order_account = (order.state!=4 || !order.partial)?make_order_account(pair.name, order.id):null;

  return  <Dialog header={<> Order {order.id.toString()} {order.state==4 && <DirectionIcon order={order} />}</>} visible={order!=null} closable onHide={onClose}>
          <Divider />
            {order && <div className="m-1 flex flex-column row-gap-2">
              <div className="flex flex-row gap-4">
                <div className="flex align-items-center flex-column">
                  <label htmlFor="_active" className="font-bold block mb-0"> Active </label>
                  <Checkbox checked={order.state==1} disabled/>
                </div>
                <Divider layout="vertical" />
                <div className="flex align-items-center flex-column">
                  <label htmlFor="_canceled" className="font-bold block mb-1"> Canceled </label>
                  <Checkbox checked={order.state==3} disabled/>
                </div>
                <Divider layout="vertical" />
                <div className="flex align-items-center flex-column">
                  <label htmlFor="_filled" className="font-bold block mb-1"> Filled </label>
                  <Checkbox checked={order.state==4} disabled/>
                </div>
                <Divider layout="vertical" />
                <div className="flex align-items-center flex-column">
                  <label htmlFor="_partial" className="font-bold block mb-1"> Partial </label>
                  <Checkbox checked={order.partial} disabled/>
                </div>

              </div>
              <div>
                <label htmlFor="_id" className="font-bold block mb-1"> Order ID </label>
                <InputText id="_id" readOnly value={order.id.toString()} />
              </div>
              {order_account &&
                <div>
                  <label htmlFor="_o_account" className="font-bold block mb-1"> Order Account <AccountTransferLink account={order_account} fungible={pair.quote_module} /> <AccountTransferLink account={order_account} fungible={pair.base_module} /> </label>
                  <InputText size={47} id="_o_account" readOnly value={order_account}/>
                </div>
              }

              { (order.state==3 || order.state==4) &&
                <>
                <div>
                  <label htmlFor="_trx" className="font-bold block mb-1"> Transaction <TransactionLink trx={order.take_tx} /> </label>

                  <InputText id="_trx" size={47} readOnly value={order.take_tx} />
                </div>

                <div>
                  <label htmlFor="_date" className="font-bold block mb-1"> Date </label>
                  <InputText id="_id" readOnly value={tx_date?tx_date.toLocaleString():""} />
                </div>
                </>}
              <div className="flex flex-row gap-4">

                <div>
                  <label htmlFor="_amount" className="font-bold block mb-1"> Amount ({pair.base})</label>
                  <InputText id="_amount" value={order.amount.toFixed(12)} />
                </div>

                <div>
                  <label htmlFor="_price" className="font-bold block mb-1"> Price ({pair.quote})</label>
                  <InputText id="_price" value={order.price.toFixed(12)} />
                </div>
              </div>
              { order.state==4 &&
                <div>
                  <label htmlFor="_fee" className="font-bold block mb-1"> Fee ({order.is_ask?pair.quote:pair.base})</label>
                  <InputText id="_fee" value={fee.toFixed(12)} />
                </div>}


              {order.state== 1 && order.maker == account &&  <> <Divider /> <Button className="w-6" label="Cancel Order" onClick={()=>onCancel(order)}/></> }
              </div>}
          </Dialog>
}


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
