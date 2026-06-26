import { AxiosErrorLoggable } from '@core/error/loggable';
import { Logger, LogMessageData } from '@core/logger';
import { HttpService } from '@nestjs/axios';
import { JwtExtractor } from '@shared/common/utils/jwt';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { type Request } from 'express';
import { lastValueFrom } from 'rxjs';
import { Stream } from 'stream';
import { InternalFilesStorageClientConfig } from './files-storage-client.config';
import {
	FileApi,
	FileRecordListResponse,
	FileRecordParentType,
	FileRecordResponse,
	FileUrlParams,
	StorageLocation,
} from './generated';
import { GenericFileStorageLoggable } from './loggables';

export class FilesStorageClientAdapter {
	constructor(
		private readonly api: FileApi,
		private readonly logger: Logger,
		// these should be removed when the generated client supports downloading files as arraybuffer
		private readonly httpService: HttpService,
		private readonly config: InternalFilesStorageClientConfig,
		private readonly req: Request
	) {
		this.logger.setContext(FilesStorageClientAdapter.name);
	}

	public async getFileRecord(fileRecordId: string): Promise<FileRecordResponse> {
		const response = await this.api.getFileRecord(fileRecordId);
		const { data } = response;

		return data;
	}

	public async uploadFromUrl(
		storageLocationId: string,
		storageLocation: StorageLocation,
		parentId: string,
		parentType: FileRecordParentType,
		fileUrlParams: FileUrlParams
	): Promise<FileRecordResponse> {
		try {
			const options = this.createOptionParams();

			const response = await this.api.uploadFromUrl(
				storageLocationId,
				storageLocation,
				parentId,
				parentType,
				fileUrlParams,
				options
			);
			return response?.data;
		} catch (error: unknown) {
			return this.handleFileStorageError(error, 'FilesStorageClientAdapter.uploadFromUrl', {
				storageLocationId,
				storageLocation,
				parentId,
				parentType,
				url: fileUrlParams.url,
			});
		}
	}

	public async getStream(fileRecordId: string, fileName: string): Promise<Stream | null> {
		try {
			// Originally used with arraybuffer type:
			// INFO: we need to stream the file from the files storage service without using the generated client,
			// because the generated client does not support downloading files as streams. Otherwise files with
			// binary content would be corrupted like pdfs, zip files, etc. Setting the responseType to 'stream'
			// will not work with the generated client.
			// const response = await this.api.download(fileRecordId, fileName, undefined, {
			// 	responseType: 'stream',
			// });
			const options = this.createOptionParams();
			const url = new URL(`/api/v3/file/download/${fileRecordId}/${fileName}`, this.config.basePath);
			const observable = this.httpService.get(url.toString(), {
				responseType: 'stream',
				...options,
			});

			const response = await lastValueFrom(observable);
			return FilesStorageClientAdapter.isStream(response.data) ? response.data : null;
		} catch (error: unknown) {
			return this.handleFileStorageError(error, 'FilesStorageClientAdapter.getStream', {
				fileRecordId,
				fileName,
			});
		}
	}

	private static isStream(obj: unknown): obj is Stream {
		return obj !== null && typeof obj === 'object' && 'pipe' in obj && typeof obj.pipe === 'function';
	}

	public async upload(
		storageLocationId: string,
		storageLocation: StorageLocation,
		parentId: string,
		parentType: FileRecordParentType,
		file: File
	): Promise<FileRecordResponse> {
		try {
			// INFO: we need to upload the file to the files storage service without using the generated client,
			// because the generated client does not support uploading files as FormData. Otherwise files with
			// binary content would be corrupted like pdfs, zip files, etc.
			const formData = new FormData();

			formData.append('storageLocationId', storageLocationId);
			formData.append('storageLocation', storageLocation);
			formData.append('parentId', parentId);
			formData.append('parentType', parentType);
			formData.append('file', file);

			const url = new URL(
				`/api/v3/file/upload/${storageLocation}/${storageLocationId}/${parentType}/${parentId}`,
				this.config.basePath
			);

			const options = this.createOptionParams();
			const observable = this.httpService.post<FileRecordResponse>(url.toString(), formData, options);
			const response = await lastValueFrom(observable);

			return response.data;
		} catch (error: unknown) {
			return this.handleFileStorageError(error, 'FilesStorageClientAdapter.upload', {
				storageLocationId,
				storageLocation,
				parentId,
				parentType,
				fileName: file.name,
			});
		}
	}

	public async deleteByParent(
		storageLocationId: string,
		storageLocation: StorageLocation,
		parentId: string,
		parentType: FileRecordParentType
	): Promise<FileRecordListResponse> {
		try {
			const options = this.createOptionParams();
			const response = await this.api.deleteByParent(storageLocationId, storageLocation, parentId, parentType, options);

			return response?.data;
		} catch (error: unknown) {
			return this.handleFileStorageError(error, 'FilesStorageClientAdapter.deleteByParent', {
				storageLocationId,
				storageLocation,
				parentId,
				parentType,
			});
		}
	}
	public async deleteFile(fileRecordId: string): Promise<FileRecordResponse> {
		try {
			const options = this.createOptionParams();
			const response = await this.api.deleteFile(fileRecordId, options);

			return response?.data;
		} catch (error: unknown) {
			return this.handleFileStorageError(error, 'FilesStorageClientAdapter.deleteFile', {
				fileRecordId,
			});
		}
	}

	private handleFileStorageError(error: unknown, calledMethod: string, params?: LogMessageData): never {
		if (error instanceof AxiosError) {
			error = new AxiosErrorLoggable(error, calledMethod);
		}

		throw new GenericFileStorageLoggable(`An unknown error occurred in ${calledMethod}`, error, params);
	}

	private createOptionParams(): AxiosRequestConfig {
		const jwt = this.getJwt();
		const options: AxiosRequestConfig = { headers: { authorization: `Bearer ${jwt}` } };

		return options;
	}

	private getJwt(): string {
		return JwtExtractor.extractJwtFromRequestOrFail(this.req);
	}
}
