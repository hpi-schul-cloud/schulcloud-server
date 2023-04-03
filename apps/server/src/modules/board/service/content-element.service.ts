import { Injectable } from '@nestjs/common';
import { Card, EntityId, TextElement } from '@shared/domain';
import { ObjectId } from 'bson';
import { BoardDoRepo } from '../repo';
import { BoardDoService } from './board-do.service';

@Injectable()
export class ContentElementService {
	constructor(private readonly boardDoRepo: BoardDoRepo, private readonly boardDoService: BoardDoService) {}

	async create(parent: Card): Promise<TextElement> {
		const element = new TextElement({
			id: new ObjectId().toHexString(),
			text: ``,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		parent.addChild(element);

		await this.boardDoRepo.save(parent.children, parent.id);

		return element;
	}

	async delete(parent: Card, elementId: EntityId): Promise<void> {
		await this.boardDoService.deleteChildWithDescendants(parent, elementId);
	}

	async move(elementId: EntityId, targetColumnId: EntityId, toIndex: number): Promise<void> {
		await this.boardDoService.moveBoardDo(elementId, targetColumnId, toIndex);
	}
}
