import { SessionId } from '@src/infra/etherpad-client/interface';

export interface CollaborativeTextEditor {
	url: string;
	path: string;
	sessionId: SessionId;
	sessionExpiryDate: Date;
}
