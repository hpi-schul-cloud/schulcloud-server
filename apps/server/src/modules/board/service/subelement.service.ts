import { Injectable, NotFoundException } from '@nestjs/common';
import {
	AnyContentSubElementDo,
	ContentSubElementFactory,
	ContentSubElementType,
	EntityId,
	isAnyContentSubElement,
	AnyContentElementDo,
} from '@shared/domain';
import { SubmissionContentBody } from '../controller/dto';
import { BoardDoRepo } from '../repo';
import { BoardDoService } from './board-do.service';
import { ContentSubElementUpdateVisitor } from './content-subelement-update.visitor';

@Injectable()
export class ContentSubElementService {
	constructor(
		private readonly boardDoRepo: BoardDoRepo,
		private readonly boardDoService: BoardDoService,
		private readonly contentSubElementFactory: ContentSubElementFactory
	) {}

	async findById(id: EntityId): Promise<AnyContentSubElementDo> {
		const element = await this.boardDoRepo.findById(id);

		if (!isAnyContentSubElement(element)) {
			throw new NotFoundException(`There is no '${element.constructor.name}' with this id`);
		}

		return element;
	}

	async create(
		userId: EntityId,
		parent: AnyContentElementDo,
		type: ContentSubElementType
	): Promise<AnyContentSubElementDo> {
		const subElement = this.contentSubElementFactory.build(userId, type);
		parent.addChild(subElement);

		await this.boardDoRepo.save(parent.children, parent);

		return subElement;
	}

	async delete(element: AnyContentSubElementDo): Promise<void> {
		await this.boardDoService.deleteWithDescendants(element);
	}

	async update(element: AnyContentSubElementDo, content: SubmissionContentBody): Promise<void> {
		const updater = new ContentSubElementUpdateVisitor(content);
		element.accept(updater);
		const parent = await this.boardDoRepo.findParentOfId(element.id);
		await this.boardDoRepo.save(element, parent);
	}
}
