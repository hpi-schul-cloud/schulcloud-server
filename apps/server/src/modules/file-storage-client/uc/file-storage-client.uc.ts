import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { FileStorageClientRepo } from '../repo';

@Injectable()
export class FileStorageClientUC {
	constructor(private readonly fileStorageClientRepo: FileStorageClientRepo, private logger: Logger) {
		this.logger.setContext(FileStorageClientUC.name);
	}

	async copyFilesOfParent(userId: EntityId, schoolId: EntityId, parentId: EntityId) {
		const files = await this.fileStorageClientRepo.copyFilesOfParent(userId, schoolId, parentId);

		const mappedResult = files;

		return mappedResult;
	}

	async listFilesOfParent(userId: EntityId, schoolId: EntityId, parentId: EntityId) {
		const files = await this.fileStorageClientRepo.listFilesOfParent(userId, schoolId, parentId);

		const mappedResult = files;

		return mappedResult;
	}
}
