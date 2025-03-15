import {  useEffect, useContext } from 'react';
import {useTrxDate} from './backend/pact';
import { Dialog } from 'primereact/dialog';
import { Divider } from 'primereact/divider';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';

import {usePairConfig, useOrder} from './backend/bro-dex-react'
import {make_order_account} from './backend/bro-dex-common'
import {ZERO} from './backend/utils'

import {AccountContext} from './AccountContext';
import {TransactionContext} from './TransactionContext';
import {TransactionLink, AccountTransferLink} from './Explorer'


const NETWORK = import.meta.env.VITE_NETWORK
const CHAIN = import.meta.env.VITE_CHAIN

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

function OrderDialog({pair, onClose, order, onCancel})
{
  const {account} = useContext(AccountContext);
  const {trxCount} = useContext(TransactionContext);
  const {data:fresh_order, mutate} = useOrder(pair.name, order.id);
  const _order = fresh_order ?? order;
  const tx_date = useTrxDate(_order.take_tx, NETWORK, CHAIN)
  const {fee_ratio} = usePairConfig(pair.name);

  const fee = fee_ratio ? (_order.is_ask?_order.amount.mul(_order.price).mul(fee_ratio):_order.amount.mul(fee_ratio))
                        : ZERO;
  const order_account = (_order.state!=4 || !_order.partial)?make_order_account(pair.name, _order.id):null;

  useEffect(() => {if(trxCount){mutate()}}, [trxCount,mutate])

  return  <Dialog header={<> Order {_order.id.toString()} {_order.state==4 && <DirectionIcon order={order} />}</>} visible={order!=null} closable onHide={onClose}>
          <Divider />
            {order && <div className="m-1 flex flex-column row-gap-2">
              <div className="flex flex-row gap-4">
                <div className="flex align-items-center flex-column">
                  <label htmlFor="_active" className="font-bold block mb-0"> Active </label>
                  <Checkbox checked={_order.state==1} disabled/>
                </div>
                <Divider layout="vertical" />
                <div className="flex align-items-center flex-column">
                  <label htmlFor="_canceled" className="font-bold block mb-1"> Canceled </label>
                  <Checkbox checked={_order.state==3} disabled/>
                </div>
                <Divider layout="vertical" />
                <div className="flex align-items-center flex-column">
                  <label htmlFor="_filled" className="font-bold block mb-1"> Filled </label>
                  <Checkbox checked={_order.state==4} disabled/>
                </div>
                <Divider layout="vertical" />
                <div className="flex align-items-center flex-column">
                  <label htmlFor="_partial" className="font-bold block mb-1"> Partial </label>
                  <Checkbox checked={_order.partial} disabled/>
                </div>

              </div>
              <div>
                <label htmlFor="_id" className="font-bold block mb-1"> Order ID </label>
                <InputText id="_id" readOnly value={_order.id.toString()} />
              </div>
              {order_account &&
                <div>
                  <label htmlFor="_o_account" className="font-bold block mb-1"> Order Account <AccountTransferLink account={order_account} fungible={pair.quote_module} /> <AccountTransferLink account={order_account} fungible={pair.base_module} /> </label>
                  <InputText size={47} id="_o_account" readOnly value={order_account}/>
                </div>
              }

              { (_order.state==3 || _order.state==4) &&
                <>
                <div>
                  <label htmlFor="_trx" className="font-bold block mb-1"> Transaction <TransactionLink trx={_order.take_tx} /> </label>

                  <InputText id="_trx" size={47} readOnly value={_order.take_tx} />
                </div>

                <div>
                  <label htmlFor="_date" className="font-bold block mb-1"> Date </label>
                  <InputText id="_id" readOnly value={tx_date?tx_date.toLocaleString():""} />
                </div>
                </>}
              <div className="flex flex-row gap-4">

                <div>
                  <label htmlFor="_amount" className="font-bold block mb-1"> Amount ({pair.base})</label>
                  <InputText id="_amount" value={_order.amount.toFixed(12)} />
                </div>

                <div>
                  <label htmlFor="_price" className="font-bold block mb-1"> Price ({pair.quote})</label>
                  <InputText id="_price" value={_order.price.toFixed(12)} />
                </div>
              </div>
              { _order.state==4 &&
                <div>
                  <label htmlFor="_fee" className="font-bold block mb-1"> Fee ({_order.is_ask?pair.quote:pair.base})</label>
                  <InputText id="_fee" value={fee.toFixed(12)} />
                </div>}


              {_order.state== 1 && order.maker == account &&  <> <Divider /> <Button className="w-6" label="Cancel Order" onClick={()=>onCancel(order)}/></> }
              </div>}
          </Dialog>
}

export default OrderDialog
