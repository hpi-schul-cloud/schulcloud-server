import type { Constructor, EntityId } from '@shared/domain/types';

export interface BoardNodeChild {
	id: EntityId;
	updatePath(parent: BoardNodeParent): void;
	updatePosition(position: number): void;
	getChildrenOfType<U extends BoardNodeChild>(type: Constructor<U>): U[];
}

export interface BoardNodeParent {
	readonly path: string;
	readonly id: EntityId;
	readonly level: number;
	readonly children: readonly BoardNodeChild[];
}
