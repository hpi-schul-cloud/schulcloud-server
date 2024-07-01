import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';

import { ToolContextType } from '@modules/tool/common/enum';
import { ContextExternalToolService } from '@modules/tool/context-external-tool/service';
import { ContextExternalTool, ContextRef } from '@modules/tool/context-external-tool/domain';
import { SchoolExternalTool, SchoolExternalToolRef } from '@modules/tool/school-external-tool/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import {
	AnyMediaBoardNode,
	BoardExternalReference,
	isMediaBoard,
	isMediaExternalToolElement,
	MediaBoard,
	MediaExternalToolElement,
} from '../../domain';
import { BoardNodeRepo } from '../../repo';

type WithLayout<T> = Extract<T, { layout: unknown }>;
type WithCollapsed<T> = Extract<T, { collapsed: unknown }>;
type WithBackgroundColor<T> = Extract<T, { backgroundColor: unknown }>;

@Injectable()
export class MediaBoardService {
	constructor(
		private readonly boardNodeRepo: BoardNodeRepo,
		private readonly contextExternalToolService: ContextExternalToolService
	) {}

	async findByExternalReference(reference: BoardExternalReference): Promise<MediaBoard[]> {
		const boardNodes = await this.boardNodeRepo.findByExternalReference(reference);

		const boards = boardNodes.filter((bn): bn is MediaBoard => isMediaBoard(bn));

		return boards;
	}

	public async createContextExternalToolForMediaBoard(
		schoolId: EntityId,
		schoolExternalTool: SchoolExternalTool,
		mediaBoard: MediaBoard
	): Promise<ContextExternalTool> {
		const contextExternalTool: ContextExternalTool = await this.contextExternalToolService.saveContextExternalTool(
			new ContextExternalTool({
				id: new ObjectId().toHexString(),
				schoolToolRef: new SchoolExternalToolRef({ schoolId, schoolToolId: schoolExternalTool.id }),
				contextRef: new ContextRef({ id: mediaBoard.id, type: ToolContextType.MEDIA_BOARD }),
				parameters: [],
			})
		);

		return contextExternalTool;
	}

	public async checkElementExists(mediaBoard: MediaBoard, schoolExternalTool: SchoolExternalTool): Promise<boolean> {
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

	public async updateBackgroundColor<T extends WithBackgroundColor<AnyMediaBoardNode>>(
		node: T,
		backgroundColor: T['backgroundColor']
	) {
		node.backgroundColor = backgroundColor;

		await this.boardNodeRepo.save(node);
	}

	public async updateCollapsed<T extends WithCollapsed<AnyMediaBoardNode>>(node: T, collapsed: T['collapsed']) {
		node.collapsed = collapsed;

		await this.boardNodeRepo.save(node);
	}

	public async updateLayout<T extends WithLayout<AnyMediaBoardNode>>(node: T, layout: T['layout']) {
		node.layout = layout;

		await this.boardNodeRepo.save(node);
	}
}
