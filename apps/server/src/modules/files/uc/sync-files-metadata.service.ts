/* istanbul ignore file */

import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { FileRecordEntity } from '@src/modules/files-storage/repo/filerecord.entity';
import { FileRecordRepo } from '@src/modules/files-storage/repo/filerecord.repo';
import { SyncFilesRepo } from '../repo/sync-files.repo';
import { SyncFileItem, SyncTargetFile } from '../types';

// Temporary functionality for migration to new fileservice
// TODO: Remove when BC-1496 is done!

@Injectable()
export class SyncFilesMetadataService {
	constructor(private readonly fileRecordRepo: FileRecordRepo, private readonly syncFilesRepo: SyncFilesRepo) {}

	public async prepareMetaData(item: SyncFileItem): Promise<SyncFileItem> {
		if (item.target) {
			return this.updateFileRecord(item);
		}

		return this.createFileRecord(item);
	}

	private async updateFileRecord(item: SyncFileItem): Promise<SyncFileItem> {
		const { source } = item;

		// This double check is only here to avoid a typescript error.
		if (!item.target) {
			throw new Error('item.target must be defined when updating filerecord');
		}

		const fileRecord = await this.fileRecordRepo.findOneById(item.target.id);
		fileRecord.deletedSince = source.deletedAt;
		fileRecord.name = source.name;
		fileRecord.size = source.size;
		fileRecord.mimeType = source.type;
		if (source.securityCheck) {
			fileRecord.securityCheck = source.securityCheck;
		}
		fileRecord.updatedAt = source.updatedAt;

		item.fileRecord = fileRecord;
		item.created = false;
		item.target.id = fileRecord.id;
		item.target.updatedAt = fileRecord.updatedAt;

		return item;
	}

	private createFileRecord(item: SyncFileItem): SyncFileItem {
		const { source } = item;
		const fileRecord = new FileRecordEntity({
			size: source.size,
			name: source.name,
			mimeType: source.type,
			parentType: item.parentType,
			parentId: item.parentId,
			creatorId: item.creatorId,
			schoolId: item.schoolId,
		});

		fileRecord._id = new ObjectId();
		if (source.securityCheck) {
			fileRecord.securityCheck = source.securityCheck;
		}
		fileRecord.deletedSince = source.deletedAt;
		fileRecord.createdAt = source.createdAt;
		fileRecord.updatedAt = source.updatedAt;

		item.fileRecord = fileRecord;
		item.created = true;
		item.target = new SyncTargetFile({
			id: fileRecord.id,
			createdAt: fileRecord.createdAt,
			updatedAt: fileRecord.updatedAt,
		});

		return item;
	}

	async persistMetaData(item: SyncFileItem) {
		const { fileRecord } = item;
		if (item.created) {
			await this.syncFilesRepo.insertFileRecord(fileRecord);
		} else {
			await this.syncFilesRepo.updateFileRecord(fileRecord);
		}

		if (item.created && item.target) {
			await this.syncFilesRepo.saveAssociation(item.source.id, item.target?.id);
		}
	}

	async persistError(sourceFileId: EntityId, error?: string) {
		await this.syncFilesRepo.saveAssociation(sourceFileId, undefined, error);
	}
}
