import { EntityName, FilterQuery } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { BaseDO, BaseEntity, EntityId, IBaseEntity } from '@shared/domain';

/**
 * This repo is deprecated do not use it for new repos.
 */
@Injectable()
export abstract class BaseDORepo<T extends BaseDO, E extends BaseEntity, I extends IBaseEntity> {
	constructor(protected readonly _em: EntityManager) {}

	abstract get entityName(): EntityName<E>;

	create(entityDO: T): T {
		const entity: E = this.mapDOToEntityWithId(entityDO);
		return this.mapEntityToDO(this._em.create(this.entityName, entity));
	}

	create2(type: new (props: IBaseEntity) => E, props: IBaseEntity): E {
		// eslint-disable-next-line new-cap
		return new type(props);
	}

	async save(entityDos: T | T[]): Promise<void> {
		const dos: T[] = Array.isArray(entityDos) ? entityDos : [entityDos];

		await Promise.all(
			dos.map(async (d) => {
				const entityInterface: I = this.mapDOToEntityWithId(d);

				let entity: E = await this._em.findOneOrFail(this.entityName, d.id as FilterQuery<E>).catch(() => {
					return this._em.create(this.entityName, this.create2(typeof E, entityInterface));
				});

				entity = Object.assign(entity, entityInterface);

				this._em.persist(entity);
			})
		);
		await this._em.flush();

		let entity: E | null;
		if (entityInterface.id) {
		} else {
			entity = null;
		}

		c;

		await this._em.persistAndFlush(entities);

		const ents: (E | null)[] = Array.isArray(entityDos)
			? await Promise.all(entityDos.map((d) => this._em.findOne(this.entityName, d.id as FilterQuery<E>)))
			: [await this._em.findOne(this.entityName, entityDos.id as FilterQuery<E>)];

		const entIds: Map<string, E> = new Map<string, E>();

		ents.forEach((e) => {
			if (e !== null) {
				entIds.set(e.id, e);
			}
		});

		const entities: E | E[] = Array.isArray(entityDos)
			? entityDos.map((d) => this.mapDOToEntityWithId(d))
			: this.mapDOToEntityWithId(entityDos);
		await this._em.persistAndFlush(entities);
	}

	async delete(entityDos: T | T[]): Promise<void> {
		const entities: E | E[] = Array.isArray(entityDos)
			? entityDos.map((d) => this.mapDOToEntityWithId(d))
			: this.mapDOToEntityWithId(entityDos);
		await this._em.removeAndFlush(entities);
	}

	async findById(id: EntityId): Promise<T> {
		const entity: E = await this._em.findOneOrFail(this.entityName, id as FilterQuery<E>);
		return this.mapEntityToDO(entity);
	}

	protected abstract mapDOToEntity(T): I;
	protected abstract mapEntityToDO(E): T;

	protected mapDOToEntityWithId(edo: T): I {
		const entity: I = this.mapDOToEntity(edo);
		entity.id = edo.id;
		return entity;
	}
}
