import {useContext, useState, useEffect, useRef} from 'react';
import {Decimal} from 'decimal.js';
import {usePairConfig, useOrderbookMedian} from './backend/bro-dex-react';
import {useTokensBalance} from './backend/tokens-react';
import { ONE, ZERO, HUNDRED } from './backend/utils';
import {AccountContext} from './AccountContext';
import { Divider } from 'primereact/divider';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import {make_order} from './backend/bro-dex-transactions';
import { Message } from 'primereact/message';
import {TransactionContext} from './TransactionContext';
import { OverlayPanel } from 'primereact/overlaypanel';
import { ConfirmPopup, confirmPopup } from 'primereact/confirmpopup';

const Currency = ({name}) => <span className="text-sm font-italic">{name}</span>

const SLIPPAGE_WARNING = Decimal("0.2")

const TYPES = [ {name:"GTC", value:"GTC"},
                {name:"IOC", value:"IOC"},
                {name:"FOK", value:"FOK"},
                {name:"Post-Only", value:"Post-Only"}
              ]

function OrderTypeHelpIcon()
{
  const op = useRef(null);
  return <>
            <span className="pi pi-question-circle cursor-pointer text-lg vertical-align-middle"  onClick={(e) => op.current.toggle(e)}/>
            <OverlayPanel className="max-w-30rem" ref={op}>
              <ul>
                <li className="my-2"> <span className="font-bold">GTC:</span> Good Till Canceled ⇒ Attempt to take 10 existing active offers (Taker) at most and creates a Maker order with the remaining amount if possible. </li>
                <li className="my-2"> <span className="font-bold">IOC:</span> Immediate Or Cancel ⇒ Attempt to take 10 existing active offers (Taker) at most. Don't create a Maker order. Unused funds are refunded.</li>
                <li className="my-2"> <span className="font-bold">FOK:</span> Fill Or Kill ⇒ Attempt to take 10 existing active offers (Taker) at most, but reverts the transaction if the order is not fully filled. </li>
                <li className="my-2"> <span className="font-bold">Post-Only:</span> Create a Maker order only if possible. Guarantee a zero fee order.</li>
              </ul>
            </OverlayPanel>
        </>

}

function FeeHelpIcon({pair})
{
  const {fee_ratio} = usePairConfig(pair.name);
  const op = useRef(null);
  return  <>
            <span className="pi pi-question-circle cursor-pointer text-lg vertical-align-middle"  onClick={(e) => op.current.toggle(e)}/>
            <OverlayPanel className="max-w-30rem" ref={op}>
              <ul className="pl-3 mt-0">
                <li className="my-2"> <span className="font-bold">Taker: {fee_ratio?fee_ratio.mul(HUNDRED).toString():"Unknown"} %</span> </li>
                <li className="my-2"> <span className="font-bold">Maker: 0 %</span> </li>

              </ul>
              In case of a mixed order (GTC), fee is only charged on the Taker&apos;s part. The overpriced part is immediately refunded.
            </OverlayPanel>
          </>

}

function HalfTradingPanel({pair, gross, fee, expected, direction, onSubmit, preSelectedOrder})
{
  const {account, key, signer} = useContext(AccountContext);
  const {min_amount, max_amount, min_price, max_price, decimals} = usePairConfig(pair.name);
  const [amount, setAmount] = useState(null);
  const [price, setPrice] = useState(null);
  const [type, setType] = useState("GTC");

  useEffect(()=> { if(preSelectedOrder) {setAmount(preSelectedOrder.amount);
                                         setPrice(preSelectedOrder.price);
                                        }}, [preSelectedOrder])

  const amount_invalid = (x) => x!=null && min_amount && max_amount && (x.lt(min_amount) || x.gt(max_amount))
  const price_invalid = (x) => x!=null && min_price && max_price && (x.lt(min_price) || x.gt(max_price))
  const _form_to_dec = x => x?Decimal(x):null;

  const _fee = fee(amount, price, type);
  const _gross = gross(amount, price, type);
  const _expected = expected(amount, price, type);
  const _net_total = (_fee!=null && _gross!=null)?_gross.plus(_fee):null;

  const InputCurrency = () => (<Currency name={direction=="BUY"?pair.quote:pair.base} />)
  const OutputCurrency = () => (<Currency name={direction=="BUY"?pair.base:pair.quote} />)

  const input_decimals =  (direction=="BUY"?pair.quote_decimals_details:pair.base_decimals_details) || 8;
  const output_decimals =  (direction=="BUY"?pair.base_decimals_details:pair.quote_decimals_details) || 8;

  return  <div className="flex flex-column w-full gap-3" >
            {direction=="BUY" &&<span className="font-bold text-primary text-center"> Buy {pair.base} from {pair.quote} </span>}
            {direction=="SELL" &&<span className="font-bold text-primary text-center"> Sell {pair.base} to {pair.quote} </span>}
              <div className="flex flex-column gap-1">
                <label htmlFor="_form_amount" className="font-bold"> Quantity:</label>
                  <div className="p-inputgroup flex-1 w-14rem">
                    <span className="p-inputgroup-addon">{pair.base}</span>
                    <InputNumber id="_form_amount" value={amount?amount.toNumber():null} invalid={amount_invalid(amount)} onValueChange={(e) => setAmount(_form_to_dec(e.value))} minFractionDigits={1} maxFractionDigits={decimals ?? 12} />
                  </div>
                  {amount_invalid(amount) && <Message className="max-w-max text-xs" severity="error" text={`[${min_amount} - ${max_amount} ]`}/>}
              </div>
              <div className="flex flex-column gap-1">
                  <label htmlFor="_form_price" className="font-bold"> {direction=="BUY"?"Max":"Min"} price:</label>
                  <div className="p-inputgroup flex-1 w-14rem">
                    <span className="p-inputgroup-addon">{pair.quote}</span>
                    <InputNumber id="_form_price" value={price?price.toNumber():null} invalid={price_invalid(price)} onValueChange={(e) => setPrice(_form_to_dec(e.value))} minFractionDigits={1} maxFractionDigits={12} />
                  </div>
                  {price_invalid(price) && <Message className="max-w-max text-xs" severity="error" text={`[${min_price} - ${max_price} ]`}/>}
              </div>

              <div className="flex flex-column">
                <label htmlFor="_form_type" className="font-bold"> Order type: <OrderTypeHelpIcon /> </label>
                <Dropdown id="_form_type" value={type} onChange={(e) => setType(e.value)} options={TYPES} optionLabel="name" className="w-full md:w-14rem" />
              </div>
              {_net_total!=null && _expected &&
                <div className="text-sm flex flex-row -mt-2">
                    <div className="flex flex-column align-self-end">
                      <div className="pb-3 text-indigo-700 text-xs pr-1"> Min Expected:</div>
                      <div> Gross: </div>
                      <div> Max Fee:</div>
                      <div className="border-top-1 pr-3 pt-1 h-1rem"> Net Total:</div>
                    </div>

                    <div className="flex flex-column justify-content-end text-right align-self-end" style={{fontFamily: "monospace"}}>
                      <div className="pb-3 text-indigo-700"> {_expected.toFixed(output_decimals)}  </div>
                      <div> {_gross.toFixed(input_decimals)}  </div>
                      <div> {_fee.toFixed(input_decimals)} </div>
                      <div className="border-top-1 pt-1 h-1rem"> {_net_total.toFixed(input_decimals)} </div>
                    </div>

                    <div className="flex flex-column ml-1 align-self-end">
                      <div className="pb-3 text-indigo-700"> <OutputCurrency /></div>
                      <div>&nbsp;</div>
                      <FeeHelpIcon pair={pair}/>
                      <div className="pt-1 h-1rem"> <InputCurrency /></div>
                    </div>

                </div>
              }
              <Button className="w-8" disabled={!amount || !price || !account || !key || !signer} label="Execute order" onClick={() => onSubmit(amount, price, type)}/>
          </div>
}

function TradingPanel({pair, preSelectedOrder})
{
  const {account, key} = useContext(AccountContext);
  const {setTrx} = useContext(TransactionContext);
  const {deposit_account, fee_ratio} = usePairConfig(pair.name);

  const {balance_a: balance_quote, balance_b:balance_base} = useTokensBalance(account, pair.quote_module, pair.base_module);
  const median_price = useOrderbookMedian(pair.name);

  const type_to_fee = x => x=="Post-Only"?ZERO:fee_ratio;

  const compute_buy_expected = (amount, price, type) => (amount && price)?amount:null;
  const compute_sell_expected = (amount, price, type) => (amount && price)?amount.mul(price):null

  const compute_buy_gross = (amount, price, type) => (amount && price)? amount.mul(price):null;
  const compute_sell_gross = (amount, price, type) => (amount && price)? amount:null;

  const compute_buy_fees = (amount, price, type) => (amount && price)? type_to_fee(type).mul(amount).mul(price):null;
  const compute_sell_fees = (amount, price, type) => (amount && price)? type_to_fee(type).mul(amount):null;

  const compute_buy_total = (amount, price, type) => (amount && price)? type_to_fee(type).plus(ONE).mul(amount).mul(price):null;
  const compute_sell_total = (amount, price, type) => (amount && price)? type_to_fee(type).plus(ONE).mul(amount):null;

  const make_buy_trx = (amount, price, type) => make_order("buy", type.toLowerCase(), pair, account, key, deposit_account,
                                                           amount, price, compute_buy_total(amount,price,type));

  const make_sell_trx = (amount, price, type) => make_order("sell", type.toLowerCase(), pair, account, key, deposit_account,
                                                            amount, price, compute_sell_total(amount,price,type));

  const _onBuy = (amount, price, type) => setTrx(make_buy_trx(amount, price, type));
  const _onSell = (amount, price, type) => setTrx(make_sell_trx(amount, price, type));

  const onBuy = (amount, price, type) => {if(median_price && price.minus(median_price).div(median_price).gt(SLIPPAGE_WARNING))
                                            confirmPopup({message: <p>The buy price is more than {SLIPPAGE_WARNING.mul(HUNDRED).toFixed(1)}% of the current price <br/> Are you sure you want to continue and experience probable slippage loss ?</p>,
                                                          icon: 'pi pi-exclamation-triangle', defaultFocus: 'reject', acceptClassName: 'p-button-danger', accept:() => _onBuy(amount, price, type)})
                                          else if( balance_quote && balance_quote.lt(compute_buy_total(amount,price,type)))
                                            confirmPopup({message: <p>Your {pair.quote} balance is too low.<br/> The transaction will probably fail. <br/> Are you sure you want to continue?</p>,
                                                          icon: 'pi pi-exclamation-circle', defaultFocus: 'reject', acceptClassName: 'p-button-danger', accept:() => _onBuy(amount, price, type)})
                                          else
                                            _onBuy(amount, price, type)};

  const onSell = (amount, price, type) => {if(median_price && median_price.minus(price).div(median_price).gt(SLIPPAGE_WARNING))
                                              confirmPopup({message: <p>The sell price is less than {SLIPPAGE_WARNING.mul(HUNDRED).toFixed(1)}% of the current price <br/> Are you sure you want to continue and experience probable slippage loss ?</p>,
                                                            icon: 'pi pi-exclamation-triangle', defaultFocus: 'reject', acceptClassName: 'p-button-danger', accept:() => _onSell(amount, price, type)})
                                           else if(balance_base && balance_base.lt(compute_sell_total(amount, price, type)))
                                              confirmPopup({message: <p>Your {pair.base} balance is too low.<br/> The transaction will probably fail. <br/> Are you sure you want to continue?</p>,
                                                            icon: 'pi pi-exclamation-circle', defaultFocus: 'reject', acceptClassName: 'p-button-danger', accept:() => _onSell(amount, price, type)})
                                           else
                                              _onSell(amount, price, type)};
  return  <>
            <ConfirmPopup />
            <div className="flex flex-row m-2 mt-4">
              <HalfTradingPanel pair={pair} expected={compute_buy_expected} gross={compute_buy_gross} fee={compute_buy_fees} direction="BUY" preSelectedOrder={preSelectedOrder?.is_ask?preSelectedOrder:null} onSubmit={onBuy}/>
              <Divider layout="vertical"/>
              <HalfTradingPanel pair={pair} expected={compute_sell_expected} gross={compute_sell_gross} fee={compute_sell_fees} direction="SELL" preSelectedOrder={!preSelectedOrder?.is_ask?preSelectedOrder:null} onSubmit={onSell}/>
            </div>
          </>
}

export {TradingPanel};
