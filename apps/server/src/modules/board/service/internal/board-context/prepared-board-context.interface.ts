import {
	BoardConfiguration,
	BoardExternalReferenceType,
	ColumnBoard,
	MediaBoard,
	UserWithBoardRoles,
} from '../../../domain';

/**
 * PreparedBoardContext holds all pre-fetched context data needed for board operations.
 * Methods are synchronous since all data is loaded upfront during construction.
 *
 * Use BoardContextResolver to create instances of PreparedBoardContext.
 */
export interface PreparedBoardContext {
	readonly type: BoardExternalReferenceType;

	/**
	 * Returns users with their board roles (sync - uses pre-fetched data).
	 */
	getUsersWithBoardRoles(): UserWithBoardRoles[];

	/**
	 * Computes board configuration based on the root node (sync - uses pre-fetched data).
	 */
	getBoardConfiguration(rootNode: MediaBoard | ColumnBoard): BoardConfiguration;
}
