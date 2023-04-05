import { Injectable } from '@nestjs/common';
import { Card, EntityId, TextElement } from '@shared/domain';
import { FileElement } from '@shared/domain/domainobject/board/file-element.do';
import { ObjectId } from 'bson';
import { BoardDoRepo } from '../repo';
import { ContentElementType } from '../types/content-elements.enum';
import { BoardDoService } from './board-do.service';

@Injectable()
export class ContentElementService {
	constructor(private readonly boardDoRepo: BoardDoRepo, private readonly boardDoService: BoardDoService) {}

	async findById(elementId: EntityId): Promise<TextElement> {
		const column = await this.boardDoRepo.findByClassAndId(TextElement, elementId);
		return column;
	}

	async create(parent: Card, type: ContentElementType): Promise<TextElement | FileElement> {
		// TODO: find better solution
		const elements = new Map<ContentElementType, TextElement | FileElement>();
		elements.set(
			ContentElementType.TEXT,
			new TextElement({
				id: new ObjectId().toHexString(),
				text: ``,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
		);
		elements.set(
			ContentElementType.FILE,
			new FileElement({
				id: new ObjectId().toHexString(),
				description: ``,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
		);

		const element = elements.get(type);
		if (!element) {
			throw new Error(`unknown type ${type} of element`);
		}
		parent.addChild(element);

		await this.boardDoRepo.save(parent.children, parent.id);

		return element;
	}

	async delete(element: TextElement): Promise<void> {
		await this.boardDoService.deleteWithDescendants(element);
	}

	async move(element: TextElement, targetCard: Card, targetPosition: number): Promise<void> {
		await this.boardDoService.move(element, targetCard, targetPosition);
	}
}
