import {useContext, useState, useEffect} from 'react';
import {useOrderbook} from './backend/bro-dex-react'
import { ZERO, HUNDRED,ZERO_FIVE } from './backend/utils'
import {TransactionContext} from './TransactionContext';
import {Decimal} from 'decimal.js';
import { SelectButton } from 'primereact/selectbutton';

import './Orderbook.css';

function cum_percent(orders)
{
  let psum = ZERO;
  const cumsum = orders.map(x => {psum = psum.add(x.amount); return psum});
  return cumsum.map(x=> x.mul(HUNDRED).div(psum))
}

function OrderBookLine({price, amount, size, onClick})
{

  return <li onClick={onClick} className="NiceOrderbook__list-item" style={{"--ob-size":size.toString()+"%"}}>
          <span className="NiceOrderbook__price">{price}</span>
          <span className="NiceOrderbook__size">{amount.toString()}</span>
        </li>
}

function aggregate_orders(orders, is_ask, precision)
{
  const result = []
  const [_first, ..._orders] = orders;
  const rounded_price = o  => o.price.toNearest(precision, is_ask?Decimal.ROUND_CEIL:Decimal.ROUND_FLOOR)

  if(!_first)
    return []
  let current_price = rounded_price(_first)
  let current_amount = _first.amount

  for (const order of _orders)
  {
    if(!rounded_price(order).equals(current_price))
    {
      result.push({price:current_price, amount:current_amount, is_ask:is_ask});
      current_price = rounded_price(order);
      current_amount = order.amount
    }
    else
      current_amount = current_amount.plus(order.amount);

  }
  result.push({price:current_price, amount:current_amount, is_ask:is_ask});
  return result;
}

const SELECTABLE_MULTIPLIERS = [Decimal("0.01"), Decimal("0.1"), Decimal("1.0"), Decimal("10.0"), Decimal("100.0")];

function OrderBook({pair, onClick})
{
  const {trxCount} = useContext(TransactionContext);
  const {data:asks, mutate:asks_mutate} = useOrderbook(pair.name, true)
  const {data:bids, mutate:bids_mutate} = useOrderbook(pair.name, false)
  const [precisionMult, setPrecsionMult] = useState(SELECTABLE_MULTIPLIERS[2])

  useEffect(() => {if(trxCount){asks_mutate(); bids_mutate()}}, [trxCount, asks_mutate, bids_mutate])

  const precision_options= SELECTABLE_MULTIPLIERS.map(x=> ({name:pair.orderbook_precision.mul(x).toString(), value:x}))


  const aggregated_asks = aggregate_orders(asks, true, precisionMult.mul(pair.orderbook_precision))
  const aggregated_bids = aggregate_orders(bids, false, precisionMult.mul(pair.orderbook_precision))

  const asks_cum_percent = cum_percent(aggregated_asks)
  const bids_cum_percent = cum_percent(aggregated_bids)

  const medianPrice = (asks.length && bids.length)?asks[0].price.plus(bids[0].price).mul(ZERO_FIVE):null
  const spread = medianPrice?asks[0].price.minus(bids[0].price).mul(HUNDRED).div(medianPrice):null

  return  <>
          <div className="flex mb-1 justify-content-center">
            <SelectButton value={precisionMult} options={precision_options} optionLabel="name" allowEmpty={false} onChange={(e) => setPrecsionMult(e.value)}/>
          </div>
          <div className="NiceOrderbook flex flex-column w-full">
            <div className="NiceOrderbook__side NiceOrderbook__side--asks">
              <ol style={{display:"flex", flexDirection:"column-reverse"}} className="NiceOrderbook__list">
                {aggregated_asks.map((x,i) => (<OrderBookLine key={i} price={x.price.toString()} size={asks_cum_percent[i]} amount={x.amount} onClick={() =>onClick(x)} />))}
              </ol>
            </div>
            <div className="NiceOrderbook__side NiceOrderbook__side--bids">
              <ol style={{display:"flex", flexDirection:"column"}} className="NiceOrderbook__list">
                {aggregated_bids.map((x,i) => (<OrderBookLine key={i} price={x.price.toString()} size={bids_cum_percent[i]} amount={x.amount} onClick={() =>onClick(x)} />))}
              </ol>
            </div>
          </div>
          {medianPrice && <div className="m-2"> <span className="font-bold"> Median Price: </span> {medianPrice.toString()} </div> }
          {spread && <div className="m-2"> <span className="font-bold"> Spread: </span>  {spread.toFixed(2)} % </div> }
        </>
}

export default OrderBook
