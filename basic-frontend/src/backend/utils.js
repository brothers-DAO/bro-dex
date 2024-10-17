import {Decimal} from 'decimals';

/* Generic types Adapters */
export const to_big_int = x=>BigInt(x.int)
export const to_int = x=>Number(x.int)
export const to_decimal = v => v?(v.decimal?Decimal(v.decimal):Decimal(v)):Decimal(0)
export const to_date = x=> x.time?new Date(x.time):new Date(x.timep)

export const to_pact_int = x=> ({int:x.toString()})
export const to_pact_decimal = x => ({decimal:x.toFixed(12)})
