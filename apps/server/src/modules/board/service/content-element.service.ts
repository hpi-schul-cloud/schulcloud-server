import type { ContextExternalTool } from '@modules/tool/context-external-tool/domain';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
	AnyBoardDo,
	AnyContentElementDo,
	Card,
	ContentElementFactory,
	ContentElementType,
	isAnyContentElement,
	SubmissionItem,
} from '@shared/domain/domainobject';
import { BoardNodeType, ExternalToolElementNodeEntity } from '@shared/domain/entity';
import { PlaceholderElementNodeEntity } from '@shared/domain/entity/boardnode/placeholder-element-node.entity';
import { EntityId } from '@shared/domain/types';
import { AnyElementContentBody } from '../controller/dto';
import { BoardDoRepo } from '../repo';
import { BoardDoService } from './board-do.service';
import { ContentElementUpdateVisitor } from './content-element-update.visitor';

@Injectable()
export class ContentElementService {
	constructor(
		private readonly boardDoRepo: BoardDoRepo,
		private readonly boardDoService: BoardDoService,
		private readonly contentElementFactory: ContentElementFactory
	) {}

	async findById(elementId: EntityId): Promise<AnyContentElementDo> {
		const element = await this.boardDoRepo.findById(elementId);

		if (!isAnyContentElement(element)) {
			throw new NotFoundException(`There is no '${element.constructor.name}' with this id`);
		}

		return element;
	}

	public async findElementsById(contextExternalToolId: EntityId): Promise<ExternalToolElementNodeEntity[]> {
		const elements = await this.boardDoRepo.findElementsById(contextExternalToolId);
		// validation?
		return elements;
	}

	public async findByContent(elementType: ContentElementType): Promise<AnyContentElementDo[]> {
		const elements: AnyContentElementDo[] = await this.boardDoRepo.findByContent(elementType);
		// validation?
		return elements;
	}

	async findParentOfId(elementId: EntityId): Promise<AnyBoardDo> {
		const parent = await this.boardDoRepo.findParentOfId(elementId);
		if (!parent) {
			throw new NotFoundException('There is no node with this id');
		}
		return parent;
	}

	async countBoardUsageForExternalTools(contextExternalTools: ContextExternalTool[]): Promise<number> {
		const count: number = await this.boardDoRepo.countBoardUsageForExternalTools(contextExternalTools);

		return count;
	}

	async create(parent: Card | SubmissionItem, type: ContentElementType): Promise<AnyContentElementDo> {
		const element = this.contentElementFactory.build(type);
		parent.addChild(element);

		await this.boardDoRepo.save(parent.children, parent);

		return element;
	}

	async delete(element: AnyContentElementDo): Promise<void> {
		await this.boardDoService.deleteWithDescendants(element);
	}

	async move(element: AnyContentElementDo, targetCard: Card, targetPosition: number): Promise<void> {
		await this.boardDoService.move(element, targetCard, targetPosition);
	}

	async update(element: AnyContentElementDo, content: AnyElementContentBody): Promise<AnyContentElementDo> {
		const updater = new ContentElementUpdateVisitor(content);
		await element.acceptAsync(updater);

		const parent = await this.boardDoRepo.findParentOfId(element.id);

		await this.boardDoRepo.save(element, parent);

		return element;
	}

	async replaceElementWithPlaceholder(contextExternalToolId: EntityId) {
		const externalToolElements: ExternalToolElementNodeEntity[] = await this.findElementsById(contextExternalToolId);

		externalToolElements.forEach((element) => {
			if (element.parentId) {
				const boardNode = this.boardDoRepo.findById(element.parentId);

				// TODO
				this.create(element.ancestorIds, BoardNodeType.PLACEHOLDER);
				const placeholder = new PlaceholderElementNodeEntity({
					title,
					type,
					parent: boardNode,
					position: element.position,
				});
			}
		});
	}
}
