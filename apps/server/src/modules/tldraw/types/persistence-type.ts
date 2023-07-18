import { WSSharedDoc } from '@src/modules/tldraw/utils';

export type Persitence = {
	bindState: (arg0: string, arg1: WSSharedDoc) => Promise<unknown>;
	writeState: (arg0: string, arg1: WSSharedDoc) => Promise<unknown>;
};
