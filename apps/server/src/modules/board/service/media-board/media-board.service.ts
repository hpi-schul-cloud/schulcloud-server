import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';

import { ToolContextType } from '@modules/tool/common/enum';
import { ContextExternalToolService } from '@modules/tool/context-external-tool';
import { ContextExternalTool, ContextExternalToolWithId, ContextRef } from '@modules/tool/context-external-tool/domain';
import { SchoolExternalToolRefDO, SchoolExternalToolWithId } from '@modules/tool/school-external-tool/domain';
import {
	AnyMediaBoardNode,
	BoardExternalReference,
	isMediaBoard,
	isMediaExternalToolElement,
	MediaBoard,
	MediaExternalToolElement,
} from '../../domain';
import { BoardNodeRepo } from '../../repo';

@Injectable()
export class MediaBoardService {
	constructor(
		private readonly boardNodeRepo: BoardNodeRepo,
		private readonly contextExternalToolService: ContextExternalToolService
	) {}

	async findByExternalReference(reference: BoardExternalReference): Promise<MediaBoard[]> {
		const boardNodes = await this.boardNodeRepo.findByExternalReference(reference);

		const boards = boardNodes.filter((bn) => isMediaBoard(bn));

		return boards as MediaBoard[];
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

		const existing = this.findMediaElements(mediaBoard);

		const exists = existing.some((element) =>
			contextExternalTools.some((tool) => tool.id === element.contextExternalToolId)
		);

		return exists;
	}

	public findMediaElements(boardNode: AnyMediaBoardNode): MediaExternalToolElement[] {
		const elements = boardNode.children.reduce((result: MediaExternalToolElement[], bn) => {
			result.push(...this.findMediaElements(bn as AnyMediaBoardNode));

			if (isMediaExternalToolElement(bn)) {
				result.push(bn);
			}

			return result;
		}, []);

		return elements;
	}
}
