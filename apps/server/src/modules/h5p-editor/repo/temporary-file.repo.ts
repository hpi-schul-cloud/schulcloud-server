import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { BaseRepo } from '@shared/repo/base.repo';
import { H5pEditorTempFile } from '../entity';

@Injectable()
export class TemporaryFileRepo extends BaseRepo<H5pEditorTempFile> {
	get entityName() {
		return H5pEditorTempFile;
	}

	async findByUserAndFilename(userId: EntityId, filename: string): Promise<H5pEditorTempFile> {
		return this._em.findOneOrFail(this.entityName, { ownedByUserId: userId, filename });
	}

	async findAllByUserAndFilename(userId: EntityId, filename: string): Promise<H5pEditorTempFile[]> {
		return this._em.find(this.entityName, { ownedByUserId: userId, filename });
	}

	async findExpired(): Promise<H5pEditorTempFile[]> {
		const now = new Date();
		return this._em.find(this.entityName, { expiresAt: { $lt: now } });
	}

	async findByUser(userId: EntityId): Promise<H5pEditorTempFile[]> {
		return this._em.find(this.entityName, { ownedByUserId: userId });
	}

	async findExpiredByUser(userId: EntityId): Promise<H5pEditorTempFile[]> {
		const now = new Date();
		return this._em.find(this.entityName, { $and: [{ ownedByUserId: userId }, { expiresAt: { $lt: now } }] });
	}
}
