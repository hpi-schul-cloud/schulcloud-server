import { BoardExternalReference } from '@modules/board';
import type { BoardNodeEntity } from '@modules/board/repo/entity/board-node.entity';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types/entity-id';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';

/**
 * @deprecated - this is here only for the sake of the legacy-board (lernraum)
 */
@Injectable()
export class ColumnBoardNodeRepo {
	constructor(private readonly em: EntityManager) {}

	public async findById(id: EntityId): Promise<BoardNodeEntity> {
		const boardNode = await this.em.findOneOrFail('BoardNodeEntity', { id });

		return boardNode as BoardNodeEntity;
	}

	public async findByExternalReference(reference: BoardExternalReference): Promise<BoardNodeEntity[]> {
		const boardNodes = await this.em.find('BoardNodeEntity', {
			context: {
				_contextId: new ObjectId(reference.id),
				_contextType: reference.type,
			},
		});

		return boardNodes as BoardNodeEntity[];
	}
}
