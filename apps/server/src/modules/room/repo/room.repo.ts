import { QueryOrder, Utils } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { Room } from '../domain/do/room.do';
import { RoomEntity } from './entity/room.entity';
import { RoomDomainMapper } from './room-domain.mapper';
import { RoomScope } from './room.scope';

@Injectable()
export class RoomRepo {
	constructor(private readonly em: EntityManager) {}

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

	public async findById(id: EntityId): Promise<Room> {
		const entity = await this.em.findOneOrFail(RoomEntity, id);
		const domainobject = RoomDomainMapper.mapEntityToDo(entity);

		return domainobject;
	}

	public async delete(room: Room | Room[]): Promise<void> {
		const rooms = Utils.asArray(room);

		rooms.forEach((r) => {
			this.em.remove(this.getProps(r));
		});

		await this.em.flush();
	}

	private getProps(room: Room): RoomEntity {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const { props } = room;
		return props as RoomEntity;
	}
}
