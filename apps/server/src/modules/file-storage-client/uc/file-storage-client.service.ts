import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { ConfigService } from '@nestjs/config';
import { FileDto } from '../dto';
import { AxiosJWTOptionBuilder, FileStorageClientMapper } from '../mapper';
import { FileApiFactory, FileApiInterface } from '../fileStorageApi/v3';
import { FileRequestInfo, IFileStorageClientConfig } from '../interfaces';

@Injectable()
export class FileStorageClientAdapterService {
	private fileStorageClient: FileApiInterface;

	constructor(private readonly configService: ConfigService<IFileStorageClientConfig, true>, private logger: Logger) {
		this.logger.setContext(FileStorageClientAdapterService.name);
		const uri = '/api/v3';
		const baseUrl = this.configService.get<string>('FILE_STORAGE_BASE_URL');

		this.fileStorageClient = FileApiFactory(undefined, baseUrl + uri);
	}

	async copyFilesOfParent(param: FileRequestInfo, target: FileRequestInfo): Promise<FileDto[]> {
		const options = AxiosJWTOptionBuilder.build(param);
		const response = await this.fileStorageClient.filesStorageControllerCopy(
			param.schoolId,
			param.parentId,
			param.parentType,
			{
				target,
			},
			options
		);
		const fileInfos = FileStorageClientMapper.mapAxiosToFilesDto(response, param.schoolId);

		return fileInfos;
	}

	async listFilesOfParent(param: FileRequestInfo): Promise<FileDto[]> {
		const options = AxiosJWTOptionBuilder.build(param);
		const response = await this.fileStorageClient.filesStorageControllerList(
			param.schoolId,
			param.parentId,
			param.parentType,
			undefined,
			undefined,
			options
		);
		const fileInfos = FileStorageClientMapper.mapAxiosToFilesDto(response, param.schoolId);

		return fileInfos;
	}
}
