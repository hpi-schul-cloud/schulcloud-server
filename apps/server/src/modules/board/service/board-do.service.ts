import { Injectable } from '@nestjs/common';
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
}
