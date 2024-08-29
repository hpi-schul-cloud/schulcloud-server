import { Injectable } from '@nestjs/common';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions } from '@shared/domain/interface';
import { EntityData, EntityName, QueryOrder } from '@mikro-orm/core';
import { RoomEntity } from './entity/room.entity';
import { Room } from '../domain/do/room.do';
import { RoomDomainMapper } from './room-domain.mapper';
import { RoomScope } from './room.scope';

@Injectable()
export class RoomRepo extends BaseDomainObjectRepo<Room, RoomEntity> {
	protected get entityName(): EntityName<RoomEntity> {
		return RoomEntity;
	}

	protected mapDOToEntityProperties(room: Room): EntityData<RoomEntity> {
		const entityProps: EntityData<RoomEntity> = RoomDomainMapper.mapDoToEntityData(room);

		return entityProps;
	}

	public async getRooms(findOptions: IFindOptions<Room>): Promise<Page<Room>> {
		const scope = new RoomScope();
		scope.allowEmptyQuery(true);
		// scope.byName('room');
		// scope.byOrganizationId(filter.schoolId);

		const options = {
			offset: findOptions?.pagination?.skip,
			limit: findOptions?.pagination?.limit,
			orderBy: { name: QueryOrder.ASC },
		};

		const [entities, total] = await this.em.findAndCount(RoomEntity, scope.query, options);

		const domainObjects: Room[] = entities.map((entity) => RoomDomainMapper.mapEntityToDo(entity));

		const page = new Page<Room>(domainObjects, total);

		return page;
	}

	/*
	public async saveRoom(room: Room): Promise<Room> {
		return this.save(room);
	}
	 */
}
