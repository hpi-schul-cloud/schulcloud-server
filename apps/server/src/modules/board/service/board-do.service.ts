import { Injectable } from '@nestjs/common';
import { AnyBoardDo, EntityId } from '@shared/domain';
import { BoardDoRepo } from '../repo';
import { ConstructorOf } from '../types/utility';

@Injectable()
export class BoardDoService {
	constructor(private readonly boardDoRepo: BoardDoRepo) {}

	async findById(id: EntityId): Promise<AnyBoardDo> {
		const domainObject = await this.boardDoRepo.findById(id);
		return domainObject;
	}

	async findByClassAndId<T extends AnyBoardDo>(doClass: ConstructorOf<T>, id: EntityId): Promise<T> {
		const domainObject = await this.boardDoRepo.findByClassAndId(doClass, id);
		return domainObject;
	}

	async findParentOfId(childId: EntityId): Promise<AnyBoardDo | undefined> {
		const parent = await this.boardDoRepo.findParentOfId(childId);
		return parent;
	}

	async deleteChildWithDescendants(parent: AnyBoardDo, childId: EntityId): Promise<void> {
		parent.removeChild(childId);
		await this.boardDoRepo.save(parent.children, parent.id);
		await this.boardDoRepo.deleteWithDescendants(childId);
	}

	async deleteWithDescendants(id: EntityId): Promise<void> {
		await this.boardDoRepo.deleteWithDescendants(id);
	}
}
