import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { BaseRepo } from '@shared/repo/base.repo';
import { BaseEntityWithTimestamp } from '../entity';

@Injectable()
export class TemporaryFileRepo extends BaseRepo<BaseEntityWithTimestamp> {
	get entityName() {
		return BaseEntityWithTimestamp;
	}

	async findByUserAndFilename(userId: EntityId, filename: string): Promise<BaseEntityWithTimestamp> {
		return this._em.findOneOrFail(this.entityName, { ownedByUserId: userId, filename });
	}

	async findAllByUserAndFilename(userId: EntityId, filename: string): Promise<BaseEntityWithTimestamp[]> {
		return this._em.find(this.entityName, { ownedByUserId: userId, filename });
	}

	async findExpired(): Promise<BaseEntityWithTimestamp[]> {
		const now = new Date();
		return this._em.find(this.entityName, { expiresAt: { $lt: now } });
	}

	async findByUser(userId: EntityId): Promise<BaseEntityWithTimestamp[]> {
		return this._em.find(this.entityName, { ownedByUserId: userId });
	}

	async findExpiredByUser(userId: EntityId): Promise<BaseEntityWithTimestamp[]> {
		const now = new Date();
		return this._em.find(this.entityName, { $and: [{ ownedByUserId: userId }, { expiresAt: { $lt: now } }] });
	}
}
