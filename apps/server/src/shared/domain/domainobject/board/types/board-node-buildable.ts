import type { AnyBoardDo } from './any-board-do';
import type { BoardNodeBuilder } from './board-node-builder';

export interface BoardNodeBuildable {
	useBoardNodeBuilder(builder: BoardNodeBuilder, parent?: AnyBoardDo): void;
}
