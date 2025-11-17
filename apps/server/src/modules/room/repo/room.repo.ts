import { Utils } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { Room } from '../domain/do/room.do';
import { RoomEntity } from './entity/room.entity';
import { RoomDomainMapper } from './room-domain.mapper';
import { RoomScope } from './room.scope';

@Injectable()
export class RoomRepo {
	constructor(private readonly em: EntityManager) {}

	public async findByIds(ids: EntityId[]): Promise<Room[]> {
		const scope = new RoomScope();
		scope.byIds(ids);

		const entities = await this.em.find(RoomEntity, scope.query);

		const domainObjects = entities.map((entity) => RoomDomainMapper.mapEntityToDo(entity));

		return domainObjects;
	}

	public async findById(id: EntityId): Promise<Room> {
		const entity = await this.em.findOneOrFail(RoomEntity, id);
		const domainobject = RoomDomainMapper.mapEntityToDo(entity);

		return domainobject;
	}

	public async save(room: Room | Room[]): Promise<void> {
		const rooms = Utils.asArray(room);

		rooms.forEach((r) => {
			const entity = RoomDomainMapper.mapDoToEntity(r);
			this.em.persist(entity);
		});

		await this.flush();
	}

	public async delete(room: Room | Room[]): Promise<void> {
		const rooms = Utils.asArray(room);

		rooms.forEach((r) => {
			const entity = RoomDomainMapper.mapDoToEntity(r);
			this.em.remove(entity);
		});

		await this.em.flush();
	}

	private flush(): Promise<void> {
		return this.em.flush();
	}
}
