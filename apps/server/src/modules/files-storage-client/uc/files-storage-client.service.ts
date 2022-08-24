import { Inject, Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { CopyFileDto, FileDto } from '../dto';
import { AxiosJWTOptionBuilder, FilesStorageClientMapper, ErrorMapper } from '../mapper';
import { CopyFileListResponse, FileApi, FileRecordListResponse } from '../filesStorageApi/v3';
import { FileRequestInfo, FileRequestOptions } from '../interfaces';

@Injectable()
export class FilesStorageClientAdapterService {
	constructor(private logger: Logger, @Inject('FileStorageClient') private readonly fileStorageClient: FileApi) {
		this.logger.setContext(FilesStorageClientAdapterService.name);
	}

	async copyFilesOfParent(param: FileRequestInfo, target: FileRequestInfo): Promise<CopyFileDto[]> {
		const options = AxiosJWTOptionBuilder.build(param);
		const response = await this.copy(param, target, options);

		const fileInfos = FilesStorageClientMapper.mapAxiosToCopyFilesDto(response);

		return fileInfos;
	}

	async listFilesOfParent(param: FileRequestInfo): Promise<FileDto[]> {
		const options = AxiosJWTOptionBuilder.build(param);
		const response = await this.list(param, options);
		const fileInfos = FilesStorageClientMapper.mapAxiosToFilesDto(response, param.schoolId);

		return fileInfos;
	}

	async deleteFilesOfParent(param: FileRequestInfo): Promise<FileDto[]> {
		const options = AxiosJWTOptionBuilder.build(param);
		const response = await this.delete(param, options);
		const fileInfos = FilesStorageClientMapper.mapAxiosToFilesDto(response, param.schoolId);

		return fileInfos;
	}

	private async copy(
		param: FileRequestInfo,
		target: FileRequestInfo,
		options: AxiosRequestConfig<FileRequestOptions>
	): Promise<AxiosResponse<CopyFileListResponse>> {
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
			const domainError = ErrorMapper.mapErrorToDomainError(err);

			throw domainError;
		}
	}

	private async list(
		param: FileRequestInfo,
		options: AxiosRequestConfig<FileRequestOptions>
	): Promise<AxiosResponse<FileRecordListResponse>> {
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
			const domainError = ErrorMapper.mapErrorToDomainError(err);

			throw domainError;
		}
	}

	private async delete(
		param: FileRequestInfo,
		options: AxiosRequestConfig<FileRequestOptions>
	): Promise<AxiosResponse<FileRecordListResponse>> {
		try {
			const response = await this.fileStorageClient.filesStorageControllerDelete(
				param.schoolId,
				param.parentId,
				param.parentType,
				options
			);

			return response;
		} catch (err) {
			const domainError = ErrorMapper.mapErrorToDomainError(err);

			throw domainError;
		}
	}
}
