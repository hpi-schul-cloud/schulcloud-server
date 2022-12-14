import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { FeathersServiceProvider } from '@shared/infra/feathers/feathers-service.provider';
import { Logger } from '@src/core/logger';

type FileLegacyParams = {
	fileId: EntityId;
	targetCourseId: EntityId;
	userId: EntityId;
};

export type FileLegacyResponse = {
	oldFileId: EntityId;
	fileId?: EntityId;
	filename?: string;
};

@Injectable()
export class FileLegacyService {
	constructor(private readonly feathersServiceProvider: FeathersServiceProvider, private logger: Logger) {}

	async copyFile(data: FileLegacyParams): Promise<FileLegacyResponse> {
		try {
			const service = this.feathersServiceProvider.getService('/fileStorage/coursefilecopy');
			const result = await service.create(data, { userId: data.userId });
			return result as FileLegacyResponse;
		} catch (error) {
			// this.logger.error('Could not copy file', error);
			return { oldFileId: data.fileId };
		}
	}
}
