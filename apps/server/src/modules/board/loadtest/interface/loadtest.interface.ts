/**
 * Interfaces for loadtest types.
 * These are defined separately to break circular dependencies between types.ts
 * and the concrete implementation classes.
 */

import type { SocketConnection } from '../socket-connection';
import type { SocketConnectionManager } from '../socket-connection-manager';
import type { BoardLoadTest } from '../board-load-test';
import type { Callback, ClassDefinition } from './loadtest.types';

/**
 * Interface for SocketConnectionManager.
 * Defined here to allow types.ts to reference it without importing the concrete class.
 */
export interface ISocketConnectionManager {
	createConnection(): Promise<SocketConnection>;
	createConnections(amount: number): Promise<SocketConnection[]>;
	getClientCount(): number;
	setOnErrorHandler(onErrorHandler: Callback): void;
	destroySocketConnections(): void;
}

/**
 * Interface for BoardLoadTest.
 * Defined here to allow types.ts to reference it without importing the concrete class.
 */
export interface IBoardLoadTest {
	runBoardTest(): Promise<void>;
	initializeLoadtestClients(boardId: string): Promise<void>;
	simulateUsersActions(): Promise<void>;
}

/**
 * Factory function type for creating BoardLoadTest instances.
 * Uses concrete types for compatibility with existing code.
 */
export type CreateBoardLoadTest = (
	socketConnectionManager: SocketConnectionManager,
	classDefinition: ClassDefinition,
	onError: Callback
) => BoardLoadTest;
