import { Injectable } from '@nestjs/common';
import { EntityId, FileRecordParentType } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { FileDto } from '../dto';
import { FileRequestInfoBuilder } from '../mapper';
import { FileStorageClientRepo } from '../repo';

@Injectable()
export class FileStorageClientService {
	constructor(private readonly fileStorageClientRepo: FileStorageClientRepo, private logger: Logger) {
		this.logger.setContext(FileStorageClientService.name);
	}

	async copyFilesOfParent(
		userId: EntityId,
		schoolId: EntityId,
		parentType: FileRecordParentType,
		parentId: EntityId
	): Promise<FileDto[]> {
		const fileRequestInfo = FileRequestInfoBuilder.build(userId, schoolId, parentType, parentId);
		const files = await this.fileStorageClientRepo.copyFilesOfParent(fileRequestInfo);

		return files;
	}

	async listFilesOfParent(
		userId: EntityId,
		schoolId: EntityId,
		parentType: FileRecordParentType,
		parentId: EntityId
	): Promise<FileDto[]> {
		const fileRequestInfo = FileRequestInfoBuilder.build(userId, schoolId, parentType, parentId);
		const files = await this.fileStorageClientRepo.listFilesOfParent(fileRequestInfo);

		return files;
	}
}
