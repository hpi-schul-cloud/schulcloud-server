import { Injectable } from '@nestjs/common';
import { BaseEntity } from '@shared/domain';
import { EntityManager } from '@mikro-orm/mongodb';

@Injectable()
export class BaseRepo<T extends BaseEntity> {
	constructor(protected readonly em: EntityManager) {}

	save(entity: T): T {
		this.em.persist(entity);
		return entity;
	}

	async saveAndFlush(entity: T): Promise<T> {
		await this.em.persistAndFlush(entity);
		return entity;
	}

	saveAll(entities: T[]): T[] {
		const persisted = entities.map((n) => {
			this.em.persist(n);
			return n;
		});
		return persisted;
	}

	async saveAllAndFlush(entities: T[]): Promise<T[]> {
		const persisted = entities.map((n) => {
			this.em.persist(n);
			return n;
		});
		await this.em.flush();
		return persisted;
	}

	delete(entity: T): void {
		this.em.remove(entity);
	}

	async deleteAndFlush(entity: T): Promise<void> {
		await this.em.removeAndFlush(entity);
	}

	deleteAll(entities: T[]): void {
		entities.forEach((entity) => this.em.remove(entity));
	}

	async deleteAllAndFlush(entities: T[]): Promise<void> {
		entities.forEach((entity) => this.em.remove(entity));
		await this.em.flush();
	}

	async flush(): Promise<void> {
		await this.em.flush();
	}
}
