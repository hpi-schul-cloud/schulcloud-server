import { Injectable } from '@nestjs/common';
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
		if (targetParent.hasChild(child)) {
			targetParent.removeChild(child);
		} else {
			const sourceParent = await this.boardDoRepo.findParentOfId(child.id);
			if (sourceParent) {
				sourceParent.removeChild(child);
				await this.boardDoRepo.save(sourceParent.children, sourceParent);
			}
		}
		targetParent.addChild(child, targetPosition);
		await this.boardDoRepo.save(targetParent.children, targetParent);
	}
}
