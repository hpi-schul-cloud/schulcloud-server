import { EntityId } from '@shared/domain/types';
import { BoardNodeBuilder } from './board-node-builder';

export interface BoardNodeBuildable {
	useBoardNodeBuilder(builder: BoardNodeBuilder, parentId?: EntityId, position?: number): void;
}
