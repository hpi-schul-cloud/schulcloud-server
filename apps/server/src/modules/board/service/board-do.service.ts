import { Injectable } from '@nestjs/common';
import { AnyBoardDo, EntityId } from '@shared/domain';
import { BoardDoRepo } from '../repo';

@Injectable()
export class BoardDoService {
	constructor(private readonly boardDoRepo: BoardDoRepo) {}

	async findById(id: EntityId, depth?: number): Promise<AnyBoardDo> {
		const domainObject = await this.boardDoRepo.findById(id, depth);
		return domainObject;
	}

	async findParentOfId(childId: EntityId): Promise<AnyBoardDo | undefined> {
		const parent = await this.boardDoRepo.findParentOfId(childId);
		return parent;
	}

	async deleteChild<T extends AnyBoardDo>(parent: T, childId: EntityId): Promise<T> {
		const removedChild = parent.removeChild(childId);
		await this.boardDoRepo.save(parent.children, parent.id);
		await this.boardDoRepo.deleteWithDescendants(removedChild.id);

		return parent;
	}

	async deleteWithDescendants(id: EntityId): Promise<void> {
		await this.boardDoRepo.deleteWithDescendants(id);
	}
}
