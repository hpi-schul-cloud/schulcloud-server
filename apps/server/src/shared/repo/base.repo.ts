import { Injectable } from '@nestjs/common';
import { BaseEntity } from '@shared/domain';
import { EntityManager } from '@mikro-orm/mongodb';

@Injectable()
export class BaseRepo<T extends BaseEntity> {
	constructor(protected readonly em: EntityManager) {}

	/**
	 * In order to save multiple entities use {@code saveAll}
	 * Due to multiple transactions consistency
	 * @param obj
	 * @param autoFlush
	 */
	async save(obj: T, autoFlush = true): Promise<T> {
		this.em.persist(obj);
		if (autoFlush) {
			await this.flush();
		}
		return obj;
	}

	async saveAll(objs: T[], autoFlush = true): Promise<T[]> {
		const persisted = objs.map((n) => {
			this.em.persist(n);
			return n;
		});
		if (autoFlush) {
			await this.em.flush();
		}
		return persisted;
	}

	async flush(): Promise<void> {
		await this.em.flush();
	}

	/**
	 * In order to delete multiple entities use {@code deleteAll}
	 * Due to multiple transactions consistency
	 * @param objs
	 */
	async delete(objs: T): Promise<void> {
		await this.em.removeAndFlush(objs);
	}

	async deleteAll(objs: T[], autoFlush = true): Promise<void> {
		objs.map((n) => this.em.remove(n));
		if (autoFlush) {
			await this.flush();
		}
	}
}
