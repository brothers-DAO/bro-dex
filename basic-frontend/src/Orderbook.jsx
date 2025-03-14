import {useContext, useState, useEffect} from 'react';
import {useOrderbook} from './backend/bro-dex-react'
import { ZERO, HUNDRED,ZERO_FIVE } from './backend/utils'
import {TransactionContext} from './TransactionContext';
import {Decimal} from 'decimal.js';
import { SelectButton } from 'primereact/selectbutton';

import './Orderbook.css';


const to_percent = (amounts, scale) => amounts.map( x => x.mul(HUNDRED).div(scale))

const orders_sum = (orders) => orders.reduce( (acc,o) => acc.add(o.amount), ZERO)

const to_amounts = (orders) => orders.map(o=> o.amount)

function orders_cumsum(orders)
{
  let psum = ZERO;
  return orders.map(x => {psum = psum.add(x.amount); return psum});
}


function OrderBookLine({price, amount, cumsize, size, onClick})
{

  return <li onClick={onClick} className="NiceOrderbook__list-item" style={{"--ob-size":size.toString()+"%", "--ob-cum-size":cumsize.toString()+"%"}}>
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

  const max_amount = Decimal.max(orders_sum(aggregated_asks), orders_sum(aggregated_bids));

  const asks_percent = to_percent(to_amounts(aggregated_asks), max_amount);
  const bids_percent = to_percent(to_amounts(aggregated_bids), max_amount);

  const asks_cum_percent = to_percent(orders_cumsum(aggregated_asks), max_amount);
  const bids_cum_percent = to_percent(orders_cumsum(aggregated_bids), max_amount);

  const medianPrice = (asks.length && bids.length)?asks[0].price.plus(bids[0].price).mul(ZERO_FIVE):null
  const spread = medianPrice?asks[0].price.minus(bids[0].price).mul(HUNDRED).div(medianPrice):null

  const _price_precision = x => x.price.precision(true)
  const best_precision = Math.max(...aggregated_asks.map(_price_precision), ...aggregated_bids.map(_price_precision))

  return  <>
          <div className="flex mb-1 justify-content-center">
            <SelectButton value={precisionMult} options={precision_options} optionLabel="name" allowEmpty={false} onChange={(e) => setPrecsionMult(e.value)}/>
          </div>
          <div className="NiceOrderbook flex flex-column w-full">
            <div className="NiceOrderbook__side NiceOrderbook__side--asks">
              <ol style={{display:"flex", flexDirection:"column-reverse"}} className="NiceOrderbook__list">
                {aggregated_asks.map((x,i) => (<OrderBookLine key={i} price={x.price.toPrecision(best_precision)} cumsize={asks_cum_percent[i]} size={asks_percent[i]} amount={x.amount} onClick={() =>onClick(x)} />))}
              </ol>
            </div>
            <div className="NiceOrderbook__side NiceOrderbook__side--bids">
              <ol style={{display:"flex", flexDirection:"column"}} className="NiceOrderbook__list">
                {aggregated_bids.map((x,i) => (<OrderBookLine key={i} price={x.price.toPrecision(best_precision)} cumsize={bids_cum_percent[i]} size={bids_percent[i]} amount={x.amount} onClick={() =>onClick(x)} />))}
              </ol>
            </div>
          </div>
          <div className="flex-row flex justify-content-between">
          {medianPrice && <div className="m-2"> <span className="font-bold"> Median Price: </span> {medianPrice.toSignificantDigits(5).toString()} {pair.quote}/{pair.base} </div> }
          {spread && <div className="m-2"> <span className="font-bold"> Spread: </span>  {spread.toFixed(2)} % </div> }
          </div>
        </>
}

export default OrderBook
