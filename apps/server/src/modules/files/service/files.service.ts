import { Logger } from '@core/logger';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { FileEntity } from '../entity';
import { FilesRepo } from '../repo';

@Injectable()
export class FilesService {
	constructor(private readonly repo: FilesRepo, private readonly logger: Logger) {
		this.logger.setContext(FilesService.name);
	}

	public async findFilesAccessibleOrCreatedByUser(userId: EntityId): Promise<FileEntity[]> {
		const files = await this.repo.findByPermissionRefIdOrCreatorId(userId);

		return files;
	}
}
