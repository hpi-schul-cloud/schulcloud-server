import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { ConfigService } from '@nestjs/config';
import { FileDto } from '../dto';
import { AxiosOptionBuilder, FileStorageClientMapper } from '../mapper';
import { FileApiFactory, FileApiInterface } from '../fileStorageApi/v3';
import { FileRequestInfo, IFileStorageClientConfig } from '../interfaces';

@Injectable()
export class FileStorageClientAdapterService {
	private fileStorageClient: FileApiInterface;

	private timeout: number;

	constructor(private readonly configService: ConfigService<IFileStorageClientConfig, true>, private logger: Logger) {
		this.logger.setContext(FileStorageClientAdapterService.name);

		this.timeout = this.configService.get<number>('INCOMING_REQUEST_TIMEOUT');

		const apiURI = '/api/v3'; // == API_VERSION_PATH
		const baseUrl = this.configService.get<string>('FILE_STORAGE_BASE_URL');

		this.fileStorageClient = FileApiFactory(undefined, baseUrl + apiURI);
	}

	async copyFilesOfParent(param: FileRequestInfo, target: FileRequestInfo): Promise<FileDto[]> {
		const options = AxiosOptionBuilder.build(param, this.timeout);
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
		const options = AxiosOptionBuilder.build(param, this.timeout);
		const skip = undefined;
		const limit = undefined;
		const response = await this.fileStorageClient.filesStorageControllerList(
			param.schoolId,
			param.parentId,
			param.parentType,
			skip,
			limit,
			options
		);
		const fileInfos = FileStorageClientMapper.mapAxiosToFilesDto(response, param.schoolId);

		return fileInfos;
	}

	async deleteFilesOfParent(param: FileRequestInfo): Promise<FileDto[]> {
		const options = AxiosOptionBuilder.build(param, this.timeout);
		const response = await this.fileStorageClient.filesStorageControllerDelete(
			param.schoolId,
			param.parentId,
			param.parentType,
			options
		);
		const fileInfos = FileStorageClientMapper.mapAxiosToFilesDto(response, param.schoolId);

		return fileInfos;
	}
}
