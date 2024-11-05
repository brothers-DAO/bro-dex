import {hash} from '@kadena/cryptography-utils';

const NS = import.meta.env.VITE_NS

export const core_mod = (p) => `${NS}.bro-dex-core-${p}`;
export const view_mod = (p) => `${NS}.bro-dex-view-${p}`;
export const wrapper_mod = (p) => `${NS}.bro-dex-wrapper-${p}`;

export const make_order_account = (p,id) => "c:"+hash(`${core_mod(p)}.ORDER-ACCOUNT{"int":"${id.toString()}"}`);

