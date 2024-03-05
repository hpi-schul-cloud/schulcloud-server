import { Injectable } from '@nestjs/common';
import { AnyBoardDo, ColumnBoard } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
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

	// TODO there is a similar method in board-do-authorizable.service.ts
	async getRootBoardDo(boardDo: AnyBoardDo): Promise<ColumnBoard> {
		const ancestorIds: EntityId[] = await this.boardDoRepo.getAncestorIds(boardDo);
		const idHierarchy: EntityId[] = [...ancestorIds, boardDo.id];
		const rootId: EntityId = idHierarchy[0];
		const rootBoardDo: AnyBoardDo = await this.boardDoRepo.findById(rootId, 1);

		if (rootBoardDo instanceof ColumnBoard) {
			return rootBoardDo;
		}

		throw new NotFoundLoggableException(ColumnBoard.name, { id: rootId });
	}
}
