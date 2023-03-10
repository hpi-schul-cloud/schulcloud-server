import type { BoardNode } from '../../../entity';
import { BoardNodeBuilder } from './board-node-builder';

export interface BoardNodeBuildable {
	useBoardNodeBuilder(builder: BoardNodeBuilder): BoardNode[];
}
