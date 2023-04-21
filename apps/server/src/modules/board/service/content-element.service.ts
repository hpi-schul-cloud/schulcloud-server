import { Injectable } from '@nestjs/common';
import { Card, EntityId, TextElement } from '@shared/domain';
import { BoardDoRepo } from '../repo';
import { BoardDoService } from './board-do.service';

@Injectable()
export class ContentElementService {
	constructor(private readonly boardDoRepo: BoardDoRepo, private readonly boardDoService: BoardDoService) {}

	async findById(elementId: EntityId): Promise<TextElement> {
		const column = await this.boardDoRepo.findByClassAndId(TextElement, elementId);
		return column;
	}

	async create(parent: Card): Promise<TextElement> {
		const element = new TextElement({
			text: ``,
		});

		parent.addChild(element);

		await this.boardDoRepo.save(parent.children, parent);

		return element;
	}

	async delete(element: TextElement): Promise<void> {
		await this.boardDoService.deleteWithDescendants(element);
	}

	async move(element: TextElement, targetCard: Card, targetPosition: number): Promise<void> {
		await this.boardDoService.move(element, targetCard, targetPosition);
	}
}
