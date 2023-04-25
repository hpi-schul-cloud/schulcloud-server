import { Injectable, NotFoundException } from '@nestjs/common';
import { AnyContentElementDo, Card, ContentElementFactory, EntityId, FileElement, TextElement } from '@shared/domain';
import { BoardDoRepo } from '../repo';
import { ContentElementType } from '../types/content-elements.enum';
import { BoardDoService } from './board-do.service';

@Injectable()
export class ContentElementService {
	constructor(
		private readonly boardDoRepo: BoardDoRepo,
		private readonly boardDoService: BoardDoService,
		private readonly contentElementFactory: ContentElementFactory
	) {}

	async findById(elementId: EntityId): Promise<AnyContentElementDo> {
		const element = await this.boardDoRepo.findById(elementId);

		if (element instanceof TextElement || element instanceof FileElement) {
			return element;
		}

		throw new NotFoundException(`There is no '${element.constructor.name}' with this id`);
	}

	async create(parent: Card, type: ContentElementType): Promise<AnyContentElementDo> {
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
}
