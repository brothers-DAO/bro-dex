import {Decimal} from 'decimal.js';
import {base64UrlEncodeArr} from '@kadena/cryptography-utils'

/* Generic types Adapters */
export const to_big_int = x=>BigInt(x.int)
export const to_int = x=>Number(x.int)
export const to_decimal = v => v?(v.decimal?Decimal(v.decimal):Decimal(v)):Decimal(0)
export const to_date = x=> x.time?new Date(x.time):new Date(x.timep)

export const to_pact_int = x=> ({int:x.toString()})
export const to_pact_decimal = x => ({decimal:x.toFixed(12)})
export const to_module = ({refName:{namespace, name}}) => namespace?[namespace,name].join("."):name

export const ONE = Decimal("1.0")
export const ZERO  = Decimal("0.0")
export const ZERO_FIVE = Decimal("0.5")
export const HUNDRED = Decimal("100.0")

/* Nonce Generator */
export function gen_nonce()
{
  const rnd = new Uint8Array(16);
  crypto.getRandomValues(rnd);
  return "bro-dex-basic:"+base64UrlEncodeArr(rnd);
}
