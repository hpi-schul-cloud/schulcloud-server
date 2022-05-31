import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { FileRecord } from "@shared/domain";
import { FileRecordRepo } from "@shared/repo";
import { SyncFilesRepo } from "../repo/sync-files.repo";
import { SyncFileItem, SyncTargetFile } from "../types";

@Injectable()
export class SyncFilesMetadataService {
	constructor(private readonly fileRecordRepo: FileRecordRepo, private readonly syncFilesRepo: SyncFilesRepo) {}

	public async syncMetaData(item: SyncFileItem): Promise<SyncFileItem> {
		if (item.target) {
			return this.updateFilerecord(item);
		}

		return this.createFilerecord(item);
	}

	public async updateFilerecord(item: SyncFileItem): Promise<SyncFileItem> {
		if (!item.target) {
			throw new InternalServerErrorException('Cannot update non-existing target file record', 'SyncFiles:meta');
		}
		const { source } = item;
		const filerecord = await this.fileRecordRepo.findOneById(item.target.id);
		// TODO: Does deletedSince information exist on file? Same for creation below.
		// filerecord.deletedSince = file.
		filerecord.name = source.name;
		filerecord.size = source.size;
		filerecord.mimeType = source.type;
		filerecord.securityCheck = source.securityCheck;
		filerecord.updatedAt = source.updatedAt;

		await this.fileRecordRepo.save(filerecord);

		item.target.id = filerecord.id;
		item.target.updatedAt = filerecord.updatedAt;

		return item;
	}

	public async createFilerecord(item: SyncFileItem): Promise<SyncFileItem> {
		const { source } = item;
		const filerecord = new FileRecord({
			size: source.size,
			name: source.name,
			mimeType: source.type,
			parentType: item.parentType,
			parentId: item.parentId,
			creatorId: item.creatorId,
			schoolId: item.schoolId,
		});

		filerecord.securityCheck = source.securityCheck;
		filerecord.createdAt = source.createdAt;
		filerecord.updatedAt = source.updatedAt;

		await this.fileRecordRepo.save(filerecord);
		await this.syncFilesRepo.saveAssociation(source.id, filerecord.id);

		item.target = new SyncTargetFile({
			id: filerecord.id,
			createdAt: filerecord.createdAt,
			updatedAt: filerecord.updatedAt,
		});

		return item;
	}
}
