import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';

import { ToolContextType } from '@modules/tool/common/enum';
import { ContextExternalToolService } from '@modules/tool/context-external-tool';
import { ContextExternalTool, ContextExternalToolWithId, ContextRef } from '@modules/tool/context-external-tool/domain';
import { SchoolExternalToolRefDO, SchoolExternalToolWithId } from '@modules/tool/school-external-tool/domain';
import { BoardNodeRepo } from '../../repo';
import {
	AnyMediaBoardNode,
	isMediaBoard,
	isMediaExternalToolElement,
	MediaBoard,
	MediaExternalToolElement,
	MediaLine,
} from '../../domain/media-board';
import { BoardExternalReference } from '../../domain';

@Injectable()
export class MediaBoardService {
	constructor(
		private readonly boardNodeRepo: BoardNodeRepo,
		private readonly contextExternalToolService: ContextExternalToolService
	) {}

	// TODO do we need this?
	async findById(boardId: EntityId): Promise<MediaBoard> {
		const boardNode = await this.boardNodeRepo.findById(boardId);
		if (!isMediaBoard(boardNode)) {
			throw new NotFoundException(`There is no '${MediaBoard.name}' with this id`);
		}

		return boardNode;
	}

	async findByExternalReference(reference: BoardExternalReference): Promise<MediaBoard[]> {
		const boardNodes = await this.boardNodeRepo.findByExternalReference(reference);

		const boards = boardNodes.filter((bn) => isMediaBoard(bn));

		return boards as MediaBoard[];
	}

	async addToBoard(parent: MediaBoard, child: MediaLine, position = 0): Promise<void> {
		parent.addChild(child, position);
		await this.boardNodeRepo.persistAndFlush(parent);
	}

	async addToMediaLine(parent: MediaLine, child: MediaExternalToolElement, position = 0): Promise<void> {
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
