import { WsSharedDocDo } from '../domain/ws-shared-doc.do';

export type Persitence = {
	bindState: (docName: string, ydoc: WsSharedDocDo) => Promise<void>;
	writeState: (docName: string, ydoc: WsSharedDocDo) => Promise<void>;
};
