import { type Socket as IoSocket } from 'socket.io';
import { type ICurrentUser } from '../auth-guard';

export type Socket = IoSocket & { handshake: { user?: ICurrentUser } };
