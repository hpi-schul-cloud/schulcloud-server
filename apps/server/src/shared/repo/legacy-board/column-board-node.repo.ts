import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { BoardExternalReference } from '@modules/board/domain/types/board-external-reference';
import { Injectable } from '@nestjs/common';
import { ColumnBoardNode } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';

@Injectable()
export class ColumnBoardNodeRepo {
	constructor(private readonly em: EntityManager) {}

	async findById(id: EntityId): Promise<ColumnBoardNode> {
		const columnBoardNode = await this.em.findOneOrFail(ColumnBoardNode, id);

		return columnBoardNode;
	}

	async findByExternalReference(reference: BoardExternalReference): Promise<ColumnBoardNode[]> {
		const columnBoardNodes = await this.em.find(ColumnBoardNode, {
			contextId: new ObjectId(reference.id),
			contextType: reference.type,
		});

		return columnBoardNodes;
	}
}
