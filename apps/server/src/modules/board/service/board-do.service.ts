import { Injectable, NotFoundException } from '@nestjs/common';
import { AnyBoardDo, EntityId } from '@shared/domain';
import { BoardDoRepo } from '../repo';

@Injectable()
export class BoardDoService {
	constructor(private readonly boardDoRepo: BoardDoRepo) {}

	async findById(id: EntityId): Promise<AnyBoardDo> {
		const domainObject = await this.boardDoRepo.findById(id);
		return domainObject;
	}

	async findParentOfId(childId: EntityId): Promise<AnyBoardDo | undefined> {
		const parent = await this.boardDoRepo.findParentOfId(childId);
		return parent;
	}

	async deleteChild<T extends AnyBoardDo>(parent: T, childId: EntityId): Promise<T> {
		if (parent.children === undefined) {
			throw new NotFoundException('child does not exist');
		}

		await this.boardDoRepo.deleteChild(parent, childId);

		parent.children = parent.children?.filter((el) => el.id !== childId);
		await this.boardDoRepo.save(parent.children, parent.id);

		return parent;
	}

	async deleteWithDescendants(id: EntityId): Promise<boolean> {
		return this.boardDoRepo.deleteWithDescendants(id);
	}
}
