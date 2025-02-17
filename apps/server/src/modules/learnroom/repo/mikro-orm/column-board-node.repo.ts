import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { BoardExternalReference } from '@modules/board';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types/entity-id';
import { ColumnBoardNode } from './column-board-node.entity';

/**
 * @deprecated - this is here only for the sake of the legacy-board (lernraum)
 */
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
