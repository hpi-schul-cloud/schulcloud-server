import { type EntityData } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BoardImportJob } from '../../domain';
import { type BoardImportJobEntity } from '../entity';

export class BoardImportJobMapper {
	public static mapEntityToDO(entity: BoardImportJobEntity): BoardImportJob {
		const domainObject = new BoardImportJob({
			id: entity.id,
			status: entity.status,
			userId: entity.userId.toHexString(),
			link: entity.link,
			target: { type: entity.targetType, id: entity.targetId.toHexString() },
			expiresAt: entity.expiresAt,
			// A job that was stored without a counter has had no attempt.
			attempts: entity.attempts ?? 0,
			startedAt: entity.startedAt,
			boardId: entity.boardId?.toHexString(),
		});

		return domainObject;
	}

	public static mapDOToEntityProperties(domainObject: BoardImportJob): EntityData<BoardImportJobEntity> {
		const props: EntityData<BoardImportJobEntity> = {
			status: domainObject.status,
			userId: new ObjectId(domainObject.userId),
			link: domainObject.link,
			targetType: domainObject.target.type,
			targetId: new ObjectId(domainObject.target.id),
			expiresAt: domainObject.expiresAt,
			attempts: domainObject.attempts,
			startedAt: domainObject.startedAt,
			boardId: domainObject.boardId ? new ObjectId(domainObject.boardId) : undefined,
		};

		return props;
	}
}
