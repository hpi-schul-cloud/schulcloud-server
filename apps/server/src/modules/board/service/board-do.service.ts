import { BadRequestException, Injectable } from '@nestjs/common';
import { AnyBoardDo, EntityId } from '@shared/domain';
import { BoardDoRepo } from '../repo';

@Injectable()
export class BoardDoService {
	constructor(private readonly boardDoRepo: BoardDoRepo) {}

	async deleteChildWithDescendants(parent: AnyBoardDo, childId: EntityId): Promise<void> {
		parent.removeChild(childId);
		await this.boardDoRepo.save(parent.children, parent.id);
		await this.boardDoRepo.deleteById(childId);
	}

	async moveBoardDo(id: EntityId, targetParentId: EntityId, toIndex: number): Promise<void> {
		const targetParent = await this.boardDoRepo.findById(targetParentId);
		const originalParent = await this.getParentOfMovingNode(id);

		const card = originalParent.removeChild(id);
		targetParent.addChild(card, toIndex);

		await this.boardDoRepo.save([originalParent, targetParent]);
	}

	private async getParentOfMovingNode(id: EntityId): Promise<AnyBoardDo> {
		const originalParent = await this.boardDoRepo.findParentOfId(id);
		if (!originalParent) {
			throw new BadRequestException('can only move BoardNodes that have a parent');
		}
		return originalParent;
	}
}
