import { Injectable } from '@nestjs/common';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions } from '@shared/domain/interface';
import { EntityData, EntityName, QueryOrder } from '@mikro-orm/core';
import { RoomEntity } from './entity/room.entity';
import { Room } from '../domain/do/room.do';
import { RoomDomainMapper } from './room-domain.mapper';
import { RoomScope } from './room.scope';

export interface RoomFilter {
	name?: string;
}

@Injectable()
export class RoomRepo extends BaseDomainObjectRepo<Room, RoomEntity> {
	protected get entityName(): EntityName<RoomEntity> {
		return RoomEntity;
	}

	protected mapDOToEntityProperties(entityDO: Room): EntityData<RoomEntity> {
		const entityProps: EntityData<RoomEntity> = RoomDomainMapper.mapDoToEntityData(entityDO, this.em);

		return entityProps;
	}

	public async getRooms(filter?: RoomFilter, options?: IFindOptions<Room>): Promise<Page<Room>> {
		const scope = new RoomScope();
		const [entities, total] = await this.em.findAndCount(RoomEntity, scope.query, {
			offset: options?.pagination?.skip,
			limit: options?.pagination?.limit,
			orderBy: { name: QueryOrder.ASC },
		});

		const domainObjects: Room[] = entities.map((entity) => RoomDomainMapper.mapEntityToDo(entity));
		entities.map((entity) => RoomDomainMapper.mapEntityToDo(entity));
		const page = new Page<Room>(domainObjects, total);

		return page;
	}
}
