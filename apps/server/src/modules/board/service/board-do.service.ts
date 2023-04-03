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

	async move(child: AnyBoardDo, targetParent: AnyBoardDo, targetPosition?: number): Promise<void> {
		const sourceParent = await this.boardDoRepo.findParentOfId(child.id);
		if (sourceParent == null) {
			throw new BadRequestException('Cannot move nodes without a parent');
		}
		sourceParent.removeChild(child.id);
		targetParent.addChild(child, targetPosition);

		await this.boardDoRepo.save([sourceParent, targetParent]);
	}
}
