import { ObjectId } from '@mikro-orm/mongodb';
import type { ContextExternalToolWithId } from '@modules/tool/context-external-tool/domain';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
	AnyBoardDo,
	type AnyMediaContentElementDo,
	isAnyMediaContentElement,
	MediaExternalToolElement,
	MediaLine,
} from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { BoardDoRepo } from '../../repo';
import { BoardDoService } from '../board-do.service';

@Injectable()
export class MediaElementService {
	constructor(private readonly boardDoRepo: BoardDoRepo, private readonly boardDoService: BoardDoService) {}

	public async findById(elementId: EntityId): Promise<AnyMediaContentElementDo> {
		const element: AnyBoardDo = await this.boardDoRepo.findById(elementId);

		if (!isAnyMediaContentElement(element)) {
			throw new NotFoundException(`There is no '${element.constructor.name}' with this id`);
		}

		return element;
	}

	public async findParentOfId(elementId: EntityId): Promise<AnyBoardDo> {
		const parent: AnyBoardDo | undefined = await this.boardDoRepo.findParentOfId(elementId);

		if (!parent) {
			throw new NotFoundException('There is no node with this id');
		}

		return parent;
	}

	public async createExternalToolElement(
		parent: MediaLine,
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
