import { ICurrentUser } from '@src/modules/authentication';
import { Socket as IoSocket } from 'socket.io';

export type Socket = IoSocket & { handshake: { user?: ICurrentUser } };

export enum ErrorTypes {
	NOT_CREATED = 'notCreated',
	NOT_LOADED = 'notLoaded',
	NOT_UPDATED = 'notUpdated',
	NOT_DELETED = 'notDeleted',
}

export enum BoardObjectTypes {
	BOARD = 'board',
	BOARD_COLUMN = 'boardColumn',
	BOARD_CARD = 'boardCard',
	BOARD_ELEMENT = 'boardElement',
}
