import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { BaseRepo } from '@shared/repo/base.repo';
import { TemporaryFile } from './temporary-file.entity';

@Injectable()
export class TemporaryFileRepo extends BaseRepo<TemporaryFile> {
	get entityName() {
		return TemporaryFile;
	}

	async findByUserAndFilename(userId: EntityId, filename: string): Promise<TemporaryFile> {
		return this._em.findOneOrFail(this.entityName, { ownedByUserId: userId, filename });
	}

	async findExpired(): Promise<TemporaryFile[]> {
		const now = new Date();
		return this._em.find(this.entityName, { expiresAt: { $lt: now } });
	}

	async findByUser(userId: EntityId): Promise<TemporaryFile[]> {
		return this._em.find(this.entityName, { ownedByUserId: userId });
	}

	async findExpiredByUser(userId: EntityId): Promise<TemporaryFile[]> {
		const now = new Date();
		return this._em.find(this.entityName, { $and: [{ ownedByUserId: userId }, { expiresAt: { $lt: now } }] });
	}
}
