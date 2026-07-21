import type { BoardLoadTest } from './board-load-test';
import type { SocketConnectionManager } from './socket-connection-manager';
import type { Callback, ClassDefinition } from './types';

export type CreateBoardLoadTest = (
	socketConnectionManager: SocketConnectionManager,
	classDefinition: ClassDefinition,
	onError: Callback
) => BoardLoadTest;
