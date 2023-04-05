import { BadRequestException, Injectable } from '@nestjs/common';
import { AnyBoardDo } from '@shared/domain';
import { BoardDoRepo } from '../repo';

@Injectable()
export class BoardDoService {
	constructor(private readonly boardDoRepo: BoardDoRepo) {}

	async deleteWithDescendants(domainObject: AnyBoardDo): Promise<void> {
		const parent = await this.boardDoRepo.findParentOfId(domainObject.id);

		if (parent) {
			parent.removeChild(domainObject);
			await this.boardDoRepo.save(parent.children, parent);
		}

		await this.boardDoRepo.delete(domainObject);
	}

	async move(child: AnyBoardDo, targetParent: AnyBoardDo, targetPosition?: number): Promise<void> {
		const sourceParent = await this.boardDoRepo.findParentOfId(child.id);

		if (sourceParent == null) {
			throw new BadRequestException('Cannot move nodes without a parent');
		}

		sourceParent.removeChild(child);
		targetParent.addChild(child, targetPosition);

		await this.boardDoRepo.save(sourceParent.children, sourceParent);
		await this.boardDoRepo.save(targetParent.children, targetParent);
	}
}
