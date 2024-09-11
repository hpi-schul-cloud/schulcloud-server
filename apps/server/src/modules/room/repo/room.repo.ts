import { EntityName, QueryOrder } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions } from '@shared/domain/interface';
import { Room } from '../domain/do/room.do';
import { RoomEntity } from './entity/room.entity';
import { RoomDomainMapper } from './room-domain.mapper';
import { RoomScope } from './room.scope';

@Injectable()
export class RoomRepo {
	constructor(private readonly em: EntityManager) {}

	get entityName(): EntityName<RoomEntity> {
		return RoomEntity;
	}

	public async findRooms(findOptions: IFindOptions<Room>): Promise<Page<Room>> {
		const scope = new RoomScope();
		scope.allowEmptyQuery(true);

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
}
