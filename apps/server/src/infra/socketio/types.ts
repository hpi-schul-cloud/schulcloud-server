import { Socket as IoSocket } from 'socket.io';
import { ICurrentUser } from '../auth-guard';

export type Socket = IoSocket & { handshake: { user?: ICurrentUser } };
