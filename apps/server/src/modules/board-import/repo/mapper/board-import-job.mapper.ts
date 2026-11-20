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
			expiresAt: entity.expiresAt,
		});

		return domainObject;
	}

	public static mapDOToEntityProperties(domainObject: BoardImportJob): EntityData<BoardImportJobEntity> {
		const props: EntityData<BoardImportJobEntity> = {
			status: domainObject.status,
			userId: new ObjectId(domainObject.userId),
			link: domainObject.link,
			expiresAt: domainObject.expiresAt,
		};

		return props;
	}
}
