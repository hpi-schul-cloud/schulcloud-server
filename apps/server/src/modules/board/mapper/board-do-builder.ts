import { NotImplementedException } from '@nestjs/common';
import { BoardNode, BoardNodeType } from '@shared/domain';
import { AnyBoardDo } from '../types';

export abstract class BoardDoBuilder {
	abstract build(boardNode: BoardNode, children: AnyBoardDo[]): AnyBoardDo;

	ensureBoardNodeType(boardNode: BoardNode, type: BoardNodeType) {
		if (boardNode.type !== type) {
			throw new NotImplementedException(`Invalid node type '${boardNode.type}'`);
		}
	}
}
