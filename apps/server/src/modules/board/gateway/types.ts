import { ICurrentUser } from '@src/modules/authentication';
import { Socket as IoSocket } from 'socket.io';

export type Socket = IoSocket & { handshake: { user?: ICurrentUser } };
