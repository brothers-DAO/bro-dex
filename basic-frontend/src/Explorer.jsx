const CHAIN = import.meta.env.VITE_CHAIN
const EXPLORER = import.meta.env.VITE_EXPLORER;
const BALANCE_EXPLORER = import.meta.env.VITE_BALANCE_EXPLORER;
const ENDPOINT = import.meta.env.VITE_ENDPOINT;

export const TransactionLink = ({trx}) => <a target="_blank" href={EXPLORER + "/txdetail/" + trx}>
                                            <i className="pi pi-external-link" / >
                                          </a>

export const AccountLink = ({account, fungible}) => <a target="_blank" href={`${EXPLORER}/account/${account}?token=${fungible}`}>
                                                      <i className="pi pi-external-link" / >
                                                    </a>

export const AccountTransferLink = ({account, fungible}) => <a target="_blank" href={`${EXPLORER}/transfer/${account}?chain=${CHAIN}&token=${fungible}`}>
                                                              <i className="pi pi-external-link" / >
                                                            </a>

export const ModuleLink = ({module}) => <a target="_blank" href={`${BALANCE_EXPLORER}/modules.html?server=${ENDPOINT}&module=${module}&chain=${CHAIN}`}>
                                              <i className="pi pi-external-link" / >
                                            </a>
