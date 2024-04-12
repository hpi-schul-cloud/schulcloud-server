import { ObjectId } from '@mikro-orm/mongodb';
import { ToolContextType } from '@modules/tool/common/enum';
import { ContextExternalToolService } from '@modules/tool/context-external-tool';
import { ContextExternalTool, ContextExternalToolWithId, ContextRef } from '@modules/tool/context-external-tool/domain';
import {
	SchoolExternalTool,
	SchoolExternalToolRefDO,
	SchoolExternalToolWithId,
} from '@modules/tool/school-external-tool/domain';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
	AnyBoardDo,
	type AnyMediaContentElementDo,
	ColumnBoard,
	isAnyMediaContentElement,
	MediaBoard,
	MediaExternalToolElement,
	MediaLine,
} from '@shared/domain/domainobject';
import { User } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { BoardDoRepo } from '../../repo';
import { BoardDoService } from '../board-do.service';

@Injectable()
export class MediaElementService {
	constructor(
		private readonly boardDoRepo: BoardDoRepo,
		private readonly boardDoService: BoardDoService,
		private readonly contextExternalToolService: ContextExternalToolService
	) {}

	public async findById(elementId: EntityId): Promise<AnyMediaContentElementDo> {
		const element: AnyBoardDo = await this.boardDoRepo.findById(elementId);

		if (!isAnyMediaContentElement(element)) {
			throw new NotFoundException(`There is no '${element.constructor.name}' with this id`);
		}

		return element;
	}

	public async createContextExternalToolForMediaBoard(
		user: User,
		schoolExternalTool: SchoolExternalToolWithId,
		mediaBoard: ColumnBoard | MediaBoard
	): Promise<ContextExternalToolWithId> {
		const contextExternalTool: ContextExternalToolWithId =
			await this.contextExternalToolService.saveContextExternalTool(
				new ContextExternalTool({
					schoolToolRef: new SchoolExternalToolRefDO({ schoolId: user.school.id, schoolToolId: schoolExternalTool.id }),
					contextRef: new ContextRef({ id: mediaBoard.id, type: ToolContextType.MEDIA_BOARD }),
					toolVersion: 0,
					parameters: [],
				})
			);

		return contextExternalTool;
	}

	public async createExternalToolElement(
		parent: MediaLine,
		position: number,
		contextExternalTool: ContextExternalToolWithId
	): Promise<MediaExternalToolElement> {
		const element: MediaExternalToolElement = new MediaExternalToolElement({
			id: new ObjectId().toHexString(),
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
			contextExternalToolId: contextExternalTool.id,
		});

		parent.addChild(element);

		await this.boardDoRepo.save(parent.children, parent);

		return element;
	}

	public async delete(element: AnyMediaContentElementDo): Promise<void> {
		await this.boardDoService.deleteWithDescendants(element);
	}

	public async move(element: AnyMediaContentElementDo, targetLine: MediaLine, targetPosition: number): Promise<void> {
		await this.boardDoService.move(element, targetLine, targetPosition);
	}
}
