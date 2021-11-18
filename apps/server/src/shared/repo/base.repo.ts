import { Injectable } from '@nestjs/common';
import { BaseEntity } from '@shared/domain';
import { EntityManager } from '@mikro-orm/mongodb';

@Injectable()
export class BaseRepo<T extends BaseEntity> {
	constructor(protected readonly em: EntityManager) {}

	persist(entity: T): T {
		this.em.persist(entity);
		return entity;
	}

	async persistAndFlush(entity: T): Promise<T> {
		await this.em.persistAndFlush(entity);
		return entity;
	}

	persistAll(entities: T[]): T[] {
		const persisted = entities.map((n) => {
			this.em.persist(n);
			return n;
		});
		return persisted;
	}

	async persistAllAndFlush(entities: T[]): Promise<T[]> {
		const persisted = entities.map((n) => {
			this.em.persist(n);
			return n;
		});
		await this.em.flush();
		return persisted;
	}

	remove(entity: T): void {
		this.em.remove(entity);
	}

	async removeAndFlush(entity: T): Promise<void> {
		await this.em.removeAndFlush(entity);
	}

	removeAll(entities: T[]): void {
		entities.forEach((entity) => this.em.remove(entity));
	}

	async removeAllAndFlush(entities: T[]): Promise<void> {
		entities.forEach((entity) => this.em.remove(entity));
		await this.em.flush();
	}

	async flush(): Promise<void> {
		await this.em.flush();
	}
}
