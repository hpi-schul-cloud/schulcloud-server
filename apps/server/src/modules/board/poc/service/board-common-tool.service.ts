import type { ContextExternalTool } from '@modules/tool/context-external-tool/domain';
import { Injectable, NotFoundException } from '@nestjs/common';
import { isColumnBoard } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { BoardNodeService } from '.';
import { AnyBoardNode, ColumnBoard, isMediaBoard, MediaBoard } from '../domain';
import { BoardNodeRepo } from '../repo';

@Injectable()
export class BoardCommonToolService {
	constructor(private readonly boardNodeRepo: BoardNodeRepo, private readonly boardNodeService: BoardNodeService) {}

	async countBoardUsageForExternalTools(contextExternalTools: ContextExternalTool[]): Promise<number> {
		// TODO check why this is done so complicated
		const toolIds: EntityId[] = contextExternalTools
			.map((tool: ContextExternalTool): EntityId | undefined => tool.id)
			.filter((id: EntityId | undefined): id is EntityId => !!id);

		const boardNodes = await this.boardNodeRepo.findByContextExternalToolIds(toolIds, 0);
		const rootIds = boardNodes.map((bn) => bn.rootId);
		// TODO maybe we should check if these are ids of actual boards?
		const boardCount = new Set(rootIds).size;

		return boardCount;
	}

	async findByDescendant(boardNode: AnyBoardNode): Promise<ColumnBoard | MediaBoard> {
		const rootNode = await this.boardNodeService.findRoot(boardNode);

		if (!isColumnBoard(boardNode) && !isMediaBoard(boardNode)) {
			throw new NotFoundException(`There is no board with this id`);
		}

		return rootNode as ColumnBoard | MediaBoard;
	}
}