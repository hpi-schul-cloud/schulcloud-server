import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { FileRecord } from '@shared/domain';
import { FileRecordRepo } from '@shared/repo';
import { SyncFilesRepo } from '../repo/sync-files.repo';
import { SyncFileItem, SyncTargetFile } from '../types';

@Injectable()
export class SyncFilesMetadataService {
	constructor(private readonly fileRecordRepo: FileRecordRepo, private readonly syncFilesRepo: SyncFilesRepo) {}

	public async syncMetaData(item: SyncFileItem): Promise<SyncFileItem> {
		if (item.target) {
			return this.updateFileRecord(item);
		}

		return this.createFileRecord(item);
	}

	public async updateFileRecord(item: SyncFileItem): Promise<SyncFileItem> {
		const { source } = item;

		if (item.target) {
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
			//await this.fileRecordRepo.save(fileRecord);

			item.target.id = fileRecord.id;
			item.target.updatedAt = fileRecord.updatedAt;
		}

		return item;
	}

	public createFileRecord(item: SyncFileItem): SyncFileItem {
		const { source } = item;
		const fileRecord = new FileRecord({
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

		//await this.fileRecordRepo.save(fileRecord);
		//await this.syncFilesRepo.saveAssociation(source.id, fileRecord.id);

		item.target = new SyncTargetFile({
			id: fileRecord.id,
			createdAt: fileRecord.createdAt,
			updatedAt: fileRecord.updatedAt,
		});

		return item;
	}

	async persist(item: SyncFileItem) {
		await this.fileRecordRepo.save(item.fileRecord);
		if (item.created && item.target) {
			await this.syncFilesRepo.saveAssociation(item.source.id, item.target?.id);
		}
	}
}
