import { Injectable, NotFoundException } from '@nestjs/common';
import {
	AnyContentElementDo,
	Card,
	ContentElementFactory,
	ContentElementType,
	EntityId,
	isAnyContentElement,
} from '@shared/domain';
import { FileElementContent, TextElementContent } from '../controller/dto';
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

	async update(element: AnyContentElementDo, content: TextElementContent | FileElementContent): Promise<void> {
		const updater = new ContentElementUpdateVisitor(content);
		element.accept(updater);
		const parent = await this.boardDoRepo.findParentOfId(element.id);
		await this.boardDoRepo.save(element, parent);
	}
}
