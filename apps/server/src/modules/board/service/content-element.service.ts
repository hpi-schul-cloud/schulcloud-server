import { Injectable } from '@nestjs/common';
import { Card, ContentElementProvider, EntityId } from '@shared/domain';
import { AnyContentElementDo } from '@shared/domain/domainobject/board/types/any-content-element-do';
import { BoardDoRepo } from '../repo';
import { ContentElementType } from '../types/content-elements.enum';
import { BoardDoService } from './board-do.service';

@Injectable()
export class ContentElementService {
	constructor(
		private readonly boardDoRepo: BoardDoRepo,
		private readonly boardDoService: BoardDoService,
		private readonly contentElementProvider: ContentElementProvider
	) {}

	async findById(elementId: EntityId): Promise<AnyContentElementDo> {
		const column = await this.boardDoRepo.findById(elementId);

		return column as AnyContentElementDo;
	}

	async create(parent: Card, type: ContentElementType): Promise<AnyContentElementDo> {
		const element = this.contentElementProvider.getElement(type);
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
