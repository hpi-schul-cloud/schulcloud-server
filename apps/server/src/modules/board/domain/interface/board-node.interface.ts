import { type EntityId } from '@shared/domain/types';

/**
 * Interface for all board node types.
 * This interface breaks the circular dependency between types/ and domain objects.
 * Concrete classes (Card, Column, etc.) implement this interface.
 */
export interface IBoardNode {
	readonly id: EntityId;
	readonly path: string;
	readonly level: number;
	readonly position: number;
	readonly createdAt: Date;
	readonly updatedAt: Date;
	readonly children: readonly IBoardNode[];
	readonly parentId: EntityId | undefined;
	readonly rootId: EntityId;
	readonly ancestorIds: readonly EntityId[];

	hasParent(): boolean;
	isRoot(): boolean;
	canHaveChild(child: IBoardNode): boolean;
	hasChild(child: IBoardNode): boolean;
	addChild(child: IBoardNode, position?: number): void;
	removeChild(child: IBoardNode): void;
}

// Note: BoardNodeType enum is defined in ../types/board-node-type.enum.ts
// and should be imported from there to avoid duplication.
