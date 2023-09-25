import { WSSharedDoc } from '@src/modules/tldraw/types/ws-shared-doc';

export type Persitence = {
	bindState: (docName: string, ydoc: WSSharedDoc) => Promise<void>;
	writeState: (docName: string, ydoc: WSSharedDoc) => Promise<void>;
};
