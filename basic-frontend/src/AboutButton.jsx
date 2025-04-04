import { useRef } from 'react';
import { OverlayPanel } from 'primereact/overlaypanel';
import {version} from'./version'
import BroDexIcon from './img/bro_dex.svg';
import BroDexPrompted from './img/Bro_dex_prompted_by_pact.jpg';

const InfoLink = ({children}) => <> {children}
                                <a className="mx-2" target="_blank" href={children}>
                                  <i className="pi pi-external-link" / >
                                </a>
                            </>

/*global GIT_COMMIT_HASH*/

export default function AboutButton() {
    const op = useRef(null);

    return (
        <div className="card flex justify-content-center">
            <img src={BroDexIcon} className="w-3rem cursor-pointer" onClick={(e) => op.current.toggle(e)}/>
            <OverlayPanel ref={op}>
                <div className="flex flex-rows">
                  <div>
                    <img src={BroDexPrompted} className="w-12rem" />
                  </div>
                <ul className="line-height-2 m-0">
                  <li> <span className="font-bold">BRO-DEX Frontend version:</span> {version} </li>

                  <li> <span className="font-bold">Repository:</span> <InfoLink> https://github.com/brothers-DAO/bro-dex</InfoLink></li>

                  <li> <span className="font-bold">Commit hash:</span> {GIT_COMMIT_HASH} </li>

                  <li> <span className="font-bold">Kadena Endpoint:</span>  {import.meta.env.VITE_ENDPOINT} </li>

                  <li> <span className="font-bold">Network:</span>  {import.meta.env.VITE_NETWORK} </li>

                  <li> <span className="font-bold">Chain:</span>  {import.meta.env.VITE_CHAIN} </li>

                  <li> <span className="font-bold">Main namespace:</span> {import.meta.env.VITE_NS} </li>

                  <li> <span className="font-bold">Explorer:</span>  <InfoLink>{import.meta.env.VITE_EXPLORER}</InfoLink></li>

                  <li> <span className="font-bold">Tokens Database:</span> {import.meta.env.VITE_TOKENS_DB}</li>

                </ul>

                </div>
            </OverlayPanel>
        </div>
    );
}
