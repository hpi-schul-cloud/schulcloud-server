import { AxiosErrorLoggable } from '@core/error/loggable';
import { Logger, LogMessageData } from '@infra/logger';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { JwtExtractor } from '@shared/common/utils/jwt';
import { AxiosRequestConfig, isAxiosError } from 'axios';
import { type Request } from 'express';
import {
	FileApi,
	FileRecordListResponse,
	FileRecordParentType,
	FileRecordResponse,
	FileUrlParams,
	StorageLocation,
} from './generated';
import { GenericFileStorageLoggable } from './loggables';

@Injectable({ scope: Scope.REQUEST })
export class FilesStorageClientAdapter {
	constructor(
		private readonly api: FileApi,
		private readonly logger: Logger,
		@Inject(REQUEST) private readonly request: Request
	) {
		this.logger.setContext(FilesStorageClientAdapter.name);
	}

	public async getFileRecord(fileRecordId: string): Promise<FileRecordResponse> {
		try {
			const options = this.createOptionParams();

			const response = await this.api.getFileRecord(fileRecordId, options);
			const { data } = response;

			return data;
		} catch (error: unknown) {
			return this.handleFileStorageError(error, 'FilesStorageClientAdapter.getFileRecord', {
				fileRecordId,
			});
		}
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
		if (isAxiosError(error)) {
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
		return JwtExtractor.extractJwtFromRequestOrFail(this.request);
	}
}
