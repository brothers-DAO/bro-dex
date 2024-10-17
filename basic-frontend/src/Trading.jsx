import {useContext, useState, useEffect} from 'react';
import {Decimal} from 'decimals';
import {usePairConfig} from './backend/bro-dex-react';
import {AccountContext} from './AccountContext';
import { Divider } from 'primereact/divider';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import {make_order} from './backend/bro-dex-transactions';
import { Message } from 'primereact/message';
import {TransactionContext} from './TransactionContext';


const Currency = ({name}) => <span className="text-sm font-italic">{name}</span>

const ZERO = Decimal("0.0")

const TYPES = [ {name:"GTC", value:"GTC"},
                {name:"IOC", value:"IOC"},
                {name:"FOK", value:"FOK"},
                {name:"Post-Only", value:"Post-Only"}
              ]

function TradingPanel({pair, preSelectedOrder})
{
  const {account, key} = useContext(AccountContext);
  const {setTrx} = useContext(TransactionContext);
  const {deposit_account, fee_ratio, min_amount, max_amount, min_price, max_price} = usePairConfig(pair.name);
  const [buyAmount, setBuyAmount] = useState(null);
  const [buyPrice, setBuyPrice] = useState(null);
  const [buyType, setBuyType] = useState("GTC");

  const [sellAmount, setSellAmount] = useState(null);
  const [sellPrice, setSellPrice] = useState(null);
  const [sellType, setSellType] = useState("GTC");

  useEffect(()=> { if(preSelectedOrder) { if(preSelectedOrder.is_ask)
                                          {
                                            setBuyAmount(preSelectedOrder.amount);setBuyPrice(preSelectedOrder.price);
                                          }
                                          else
                                          {
                                            setSellAmount(preSelectedOrder.amount);setSellPrice(preSelectedOrder.price)
                                          }}}, [preSelectedOrder])

  const exp_buy_fees = (buyAmount && buyPrice)? (buyType!= "Post-Only"?fee_ratio.mul(buyAmount).mul(buyPrice):ZERO):null;
  const exp_sell_fees = (sellAmount && sellPrice)? (sellType!= "Post-Only"?fee_ratio.mul(sellAmount):ZERO):null;
  const buy_total = (buyAmount && buyPrice)?  buyType=="Post-Only"?buyAmount.mul(buyPrice):fee_ratio.plus(Decimal(1.0)).mul(buyAmount).mul(buyPrice) : ZERO;
  const sell_total = (sellAmount && sellPrice)? buyType=="Post-Only"?sellAmount:fee_ratio.plus(Decimal(1.0)).mul(sellAmount): ZERO;
  const make_buy_trx = () => make_order("buy", buyType.toLowerCase(), pair, account, key, deposit_account, buyAmount, buyPrice, buy_total)
  const make_sell_trx = () => make_order("sell", buyType.toLowerCase(), pair, account, key, deposit_account, sellAmount, sellPrice, sell_total)

  const onBuy = () => setTrx(make_buy_trx())
  const onSell = () => setTrx(make_sell_trx())

  const amount_invalid = (x) => x!=null && min_amount && max_amount && (x.lt(min_amount) || x.gt(max_amount))
  const price_invalid = (x) => x!=null && min_price && max_price && (x.lt(min_price) || x.gt(max_price))

/*(pair, account, deposit, key, amount, limit, total)*/
  return <>
            <div className="flex flex-row m-2 mt-4">
            <div className="flex flex-column w-full gap-3" >
              <span className="font-bold text-primary text-center"> Buy {pair.base} from {pair.quote} </span>
              <div className="flex flex-column gap-1">
                  <label htmlFor="_buy_amount" className="font-bold"> Quantity:</label>
                  <div className="p-inputgroup flex-1 w-14rem">
                    <span className="p-inputgroup-addon">{pair.base}</span>
                    <InputNumber id="_buy_amount" value={buyAmount?buyAmount.toNumber():null} invalid={amount_invalid(buyAmount)} onValueChange={(e) => setBuyAmount(e.value && Decimal(e.value))} minFractionDigits={1} maxFractionDigits={12} />
                  </div>
                  {amount_invalid(buyAmount) && <Message className="max-w-max text-xs" severity="error" text={`[${min_amount} - ${max_amount} ]`}/>}
              </div>
              <div className="flex flex-column gap-1">
                  <label htmlFor="_buy_price" className="font-bold"> Max price:</label>
                  <div className="p-inputgroup flex-1 w-14rem">
                    <span className="p-inputgroup-addon">{pair.quote}</span>
                    <InputNumber id="_buy_price" value={buyPrice?buyPrice.toNumber():null} invalid={price_invalid(buyPrice)} onValueChange={(e) => setBuyPrice(e.value && Decimal(e.value))} minFractionDigits={1} maxFractionDigits={12} />
                  </div>
                  {price_invalid(buyPrice) && <Message className="max-w-max text-xs" severity="error" text={`[${min_price} - ${max_price} ]`}/>}
              </div>

              <div className="flex flex-column">
                <label htmlFor="_buy_type" className="font-bold"> Order type:</label>
                <Dropdown id="_buy_type" value={buyType} onChange={(e) => setBuyType(e.value)} options={TYPES} optionLabel="name" className="w-full md:w-14rem" />
              </div>
               {exp_buy_fees!=null && <span className="text-sm"> Max fee: {exp_buy_fees.toFixed(12)} <Currency name={pair.quote} /> </span>}
               <Button className="w-8" disabled={!buyAmount || !buyPrice || !account} label="Execute order" onClick={onBuy}/>
            </div>

            <Divider layout="vertical"/>

            <div className="flex flex-column w-full gap-3" >
              <span className="font-bold text-primary text-center"> Sell {pair.base} to {pair.quote} </span>

              <div className="flex flex-column gap-1">
                  <label htmlFor="_sell_amount" className="font-bold"> Quantity:</label>
                  <div className="p-inputgroup flex-1 w-14rem">
                    <span className="p-inputgroup-addon">{pair.base}</span>
                    <InputNumber  id="_sell_amount" value={sellAmount?sellAmount.toNumber():null} invalid={amount_invalid(sellAmount)} onValueChange={(e) => setSellAmount(e.value && Decimal(e.value))} minFractionDigits={1} maxFractionDigits={12} />
                  </div>
                  {amount_invalid(sellAmount) && <Message className="max-w-max" severity="error" text={`[${min_amount} - ${max_amount} ]`}/>}
              </div>
              <div className="flex flex-column gap-1">
                  <label htmlFor="_sell_price" className="font-bold"> Min price:</label>
                  <div className="p-inputgroup flex-1 w-14rem">
                    <span className="p-inputgroup-addon">{pair.quote}</span>
                    <InputNumber id="_sell_price" value={sellPrice?sellPrice.toNumber():null} invalid={price_invalid(sellPrice)} onValueChange={(e) => setSellPrice(e.value && Decimal(e.value))} minFractionDigits={1} maxFractionDigits={12} />
                  </div>
                  {price_invalid(sellPrice) && <Message className="max-w-max text-xs" severity="error" text={`[${min_price} - ${max_price} ]`}/>}
              </div>

              <div className="flex flex-column">
                <label htmlFor="_sell_type" className="font-bold"> Order type:</label>
                <Dropdown id="_sell_type" value={sellType} onChange={(e) => setSellType(e.value)} options={TYPES} optionLabel="name" className="w-full md:w-14rem" />
              </div>
              {exp_sell_fees!=null && <span className="text-sm"> Max fee: {exp_sell_fees.toFixed(12)} <Currency name={pair.base} /> </span>}
              <Button className="w-8" disabled={!sellAmount || !sellPrice || !account} label="Execute order" onClick={onSell}/>
            </div>
        </div>
      </>
}

export {TradingPanel};
