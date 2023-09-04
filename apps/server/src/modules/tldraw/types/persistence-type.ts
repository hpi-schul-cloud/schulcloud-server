import { WSSharedDoc } from '@src/modules/tldraw/utils';

export type Persitence = {
	bindState: (docName: string, ydoc: WSSharedDoc) => Promise<void>;
	writeState: (docName: string, ydoc: WSSharedDoc) => Promise<void>;
};
