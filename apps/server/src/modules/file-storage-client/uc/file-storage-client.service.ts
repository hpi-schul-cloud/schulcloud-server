import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { FileDto } from '../dto';
import { FileStorageClientMapper } from '../mapper';
import { FileApiFactory } from '../fileStorageApi/v3';
import { FileRequestInfo } from '../interfaces';

const fileStorageClient = FileApiFactory(undefined, 'http://localhost:4444/api/v3/');

@Injectable()
export class FileStorageClientAdapterService {
	constructor(private logger: Logger) {
		this.logger.setContext(FileStorageClientAdapterService.name);
	}

	async copyFilesOfParent(param: FileRequestInfo, target: FileRequestInfo): Promise<FileDto[]> {
		const response = await fileStorageClient.filesStorageControllerCopy(
			param.schoolId,
			param.parentId,
			param.parentType,
			{
				target,
			}
		);
		const fileInfos = FileStorageClientMapper.mapAxiosToFilesDto(response, param.schoolId);

		return fileInfos;
	}

	async listFilesOfParent(param: FileRequestInfo): Promise<FileDto[]> {
		const response = await fileStorageClient.filesStorageControllerList(
			param.schoolId,
			param.parentId,
			param.parentType
		);
		const fileInfos = FileStorageClientMapper.mapAxiosToFilesDto(response, param.schoolId);

		return fileInfos;
	}
}
