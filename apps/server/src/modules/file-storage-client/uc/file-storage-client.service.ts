import { Inject, Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { AxiosRequestConfig } from 'axios';
import { FileDto } from '../dto';
import { AxiosJWTOptionBuilder, FileStorageClientMapper, ErrorMapper } from '../mapper';
import { FileApi } from '../fileStorageApi/v3';
import { FileRequestInfo, FileRequestOptions } from '../interfaces';

@Injectable()
export class FileStorageClientAdapterService {
	constructor(private logger: Logger, @Inject('FileStorageClient') private readonly fileStorageClient: FileApi) {
		this.logger.setContext(FileStorageClientAdapterService.name);
	}

	async copyFilesOfParent(param: FileRequestInfo, target: FileRequestInfo): Promise<FileDto[]> {
		const options = AxiosJWTOptionBuilder.build(param);
		const response = await this.copy(param, target, options);
		const fileInfos = FileStorageClientMapper.mapAxiosToFilesDto(response, param.schoolId);

		return fileInfos;
	}

	async listFilesOfParent(param: FileRequestInfo): Promise<FileDto[]> {
		const options = AxiosJWTOptionBuilder.build(param);
		const response = await this.list(param, options);
		const fileInfos = FileStorageClientMapper.mapAxiosToFilesDto(response, param.schoolId);

		return fileInfos;
	}

	async deleteFilesOfParent(param: FileRequestInfo): Promise<FileDto[]> {
		const options = AxiosJWTOptionBuilder.build(param);
		const response = await this.delete(param, options);
		const fileInfos = FileStorageClientMapper.mapAxiosToFilesDto(response, param.schoolId);

		return fileInfos;
	}

	private async copy(param: FileRequestInfo, target: FileRequestInfo, options: AxiosRequestConfig<FileRequestOptions>) {
		try {
			const response = await this.fileStorageClient.filesStorageControllerCopy(
				param.schoolId,
				param.parentId,
				param.parentType,
				{
					target,
				},
				options
			);

			return response;
		} catch (err) {
			// const error = ErrorMapper.mapAxiosToDomainError(err); todo
			this.logger.error(err);
			throw err;
		}
	}

	private async list(param: FileRequestInfo, options: AxiosRequestConfig<FileRequestOptions>) {
		try {
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

			return response;
		} catch (err) {
			// const error = ErrorMapper.mapAxiosToDomainError(err);  todo
			this.logger.error(err);
			throw err;
		}
	}

	private async delete(param: FileRequestInfo, options: AxiosRequestConfig<FileRequestOptions>) {
		try {
			const response = await this.fileStorageClient.filesStorageControllerDelete(
				param.schoolId,
				param.parentId,
				param.parentType,
				options
			);

			return response;
		} catch (err) {
			// const error = ErrorMapper.mapAxiosToDomainError(err);  todo
			this.logger.error(err);
			throw err;
		}
	}
}
