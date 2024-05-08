import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';

import { ToolContextType } from '@modules/tool/common/enum';
import { ContextExternalToolService } from '@modules/tool/context-external-tool';
import { ContextExternalTool, ContextExternalToolWithId, ContextRef } from '@modules/tool/context-external-tool/domain';
import { SchoolExternalToolRefDO, SchoolExternalToolWithId } from '@modules/tool/school-external-tool/domain';
import { BoardNodeRepo } from '../../repo';
import { MediaBoard, MediaExternalToolElement, MediaLine } from '../../domain';
import { AnyMediaBoardNode } from '../../domain/media-board/types/any-media-board-node';

@Injectable()
export class MediaBoardService {
	constructor(
		private readonly boardNodeRepo: BoardNodeRepo,
		private readonly contextExternalToolService: ContextExternalToolService
	) {}

	async addToBoard(parent: MediaBoard, child: MediaLine, position = 0): Promise<void> {
		parent.addChild(child, position);
		await this.boardNodeRepo.persistAndFlush(parent);
	}

	async addToMediaLine(parent: MediaLine, child: AnyMediaBoardNode, position = 0): Promise<void> {
		parent.addChild(child, position);
		await this.boardNodeRepo.persistAndFlush(parent);
	}

	public async createContextExternalToolForMediaBoard(
		schoolId: EntityId,
		schoolExternalTool: SchoolExternalToolWithId,
		mediaBoard: MediaBoard
	): Promise<ContextExternalToolWithId> {
		const contextExternalTool: ContextExternalToolWithId =
			await this.contextExternalToolService.saveContextExternalTool(
				new ContextExternalTool({
					schoolToolRef: new SchoolExternalToolRefDO({ schoolId, schoolToolId: schoolExternalTool.id }),
					contextRef: new ContextRef({ id: mediaBoard.id, type: ToolContextType.MEDIA_BOARD }),
					toolVersion: 0,
					parameters: [],
				})
			);

		return contextExternalTool;
	}

	public async checkElementExists(
		mediaBoard: MediaBoard,
		schoolExternalTool: SchoolExternalToolWithId
	): Promise<boolean> {
		const contextExternalTools: ContextExternalTool[] = await this.contextExternalToolService.findContextExternalTools({
			schoolToolRef: { schoolToolId: schoolExternalTool.id },
		});

		// TODO fix this
		const existing: MediaExternalToolElement[] = mediaBoard.getChildrenOfType(MediaExternalToolElement);

		const exists = existing.some((element) =>
			contextExternalTools.some((tool) => tool.id === element.contextExternalToolId)
		);

		return exists;
	}
}
