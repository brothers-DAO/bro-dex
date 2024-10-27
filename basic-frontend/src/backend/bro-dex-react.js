import {useLocalPactImmutable, local_pact} from './pact';
import useSWRInfinite from 'swr/infinite';
import {to_decimal, to_big_int, ZERO_FIVE} from './utils.js';
import {core_mod, wrapper_mod, view_mod} from './bro-dex-common';

/* Modules refs */
const NETWORK = import.meta.env.VITE_NETWORK;
const CHAIN = import.meta.env.VITE_CHAIN;


const to_order = ({state, amount, id, price, "is-ask":is_ask, partial, "take-tx":take_tx, "maker-acct":maker}) =>
                 ({maker, state:state.int, take_tx, partial, amount:to_decimal(amount), price:to_decimal(price), id:to_big_int(id), is_ask})

export function usePairConfig(pair)
{
  const {data} = useLocalPactImmutable(`{'a:[${core_mod(pair)}.MIN-PRICE, ${core_mod(pair)}.MAX-PRICE, ${core_mod(pair)}.MIN-AMOUNT, ${core_mod(pair)}.MAX-AMOUNT, ${core_mod(pair)}.FEE-RATIO],
                                       'b:${wrapper_mod(pair)}.DEPOSIT-ACCOUNT}`, NETWORK, CHAIN)

  if(data)
  {
    const [min_price, max_price, min_amount, max_amount, fee_ratio] = data.a.map(to_decimal);
    const deposit_account = data.b;
    return {min_price, max_price, min_amount, max_amount,fee_ratio, deposit_account};
  }
  return {};
}


const SIZE_PER_REQUEST = 32;
const __getKey = (prefix, pageIndex, prev) =>
{
  if(pageIndex == 0)
    return [...prefix, 0n]
  else if(prev.length == SIZE_PER_REQUEST)
    return [...prefix, prev[SIZE_PER_REQUEST - 1].id]
  else
    return null;
}

export function useOrderbook(pair, is_ask)
{
  const PREFIX = ["O", pair, is_ask.toString()]

  const {data, error, mutate} = useSWRInfinite((i, p) => __getKey(PREFIX, i, p),
                                               ([,,,x]) => local_pact(`(${view_mod(pair)}.get-orderbook ${is_ask.toString()} ${x} ${SIZE_PER_REQUEST})`,NETWORK, CHAIN)
                                                           .then(x => x.map(to_order)), {initialSize:1024, refreshInterval: 60_000})
  if(error)
    console.error(error)
  return {data:data?data.flat():[], error, mutate}
}

export function useOrderbookMedian(pair)
{
  const {data:data_ask} = useOrderbook(pair, true);
  const {data:data_bid} = useOrderbook(pair, false);

  if (!data_bid || !data_ask || data_bid.length == 0 || data_ask.length == 0)
    return null;
  else
    return data_bid[0].price.plus(data_ask[0].price).mul(ZERO_FIVE);
}

export function useHistory(pair)
{
  const PREFIX = ["H", pair, ""];
  const {data, error, mutate, size, setSize} = useSWRInfinite((i, p) => __getKey(PREFIX, i, p),
                                                             ([,,,x]) => local_pact(`(${view_mod(pair)}.get-orders-in-history ${x} ${SIZE_PER_REQUEST})`,NETWORK, CHAIN)
                                                                         .then(x => x.map(to_order)), {initialSize:1, revalidateFirstPage:true, refreshInterval: 60_000})
  if(error)
    console.error(error)
  const _setSize = (x) => {const new_size = Math.ceil(x / SIZE_PER_REQUEST);
                           if(new_size > size) {setSize(new_size) }}

  const _data = data?data.flat():[]
  const _total = _data.length%SIZE_PER_REQUEST != 0?_data.length:_data.length+50;

  return {data:_data, error, mutate, setSize:_setSize, totalSize:_total}
}

export function useAccountHistory(pair, account)
{
  const PREFIX = ["AH", pair, account];
  const {data, error, mutate} = useSWRInfinite((i, p) => __getKey(PREFIX, i, p),
                                               ([,,,x]) => local_pact(`(${view_mod(pair)}.get-orders-in-account-history "${account}" ${x} ${SIZE_PER_REQUEST})`,NETWORK, CHAIN)
                                                         .then(x => x.map(to_order)), {initialSize:1024, refreshInterval: 60_000})
  if(error)
    console.error(error)
  return {data:data?data.flat():[], error, mutate}
}


export function useActiveMakerTransactions(pair, account)
{
  const PREFIX = ["AM", pair, account];
  const {data, error, mutate} = useSWRInfinite((i, p) => __getKey(PREFIX, i, p),
                                               ([,,,x]) => local_pact(`(${view_mod(pair)}.get-orders-by-maker "${account}" ${x} ${SIZE_PER_REQUEST})`,NETWORK, CHAIN)
                                                         .then(x => x.map(to_order)), {initialSize:1024, refreshInterval: 60_000})

  if(error)
    console.error(error)
  return {data:data?data.flat():[], error, mutate}
}
