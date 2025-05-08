import { DomainErrorHandler } from '@core/error';
import { LegacyLogger } from '@core/logger';
import {
	AuthorizationBodyParamsReferenceType,
	AuthorizationClientAdapter,
	AuthorizationContextBuilder,
	AuthorizationContextParams,
	AuthorizationContextParamsRequiredPermissions,
} from '@infra/authorization-client';
import { EntityManager, RequestContext } from '@mikro-orm/core';
import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Counted, EntityId } from '@shared/domain/types';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import busboy from 'busboy';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';
import internal from 'stream';
import {
	ErrorType,
	FileRecord,
	FileRecordParentType,
	FilesStorageService,
	GetFileResponse,
	PreviewService,
	StorageLocation,
} from '../../domain';
import {
	CopyFileParams,
	CopyFileResponse,
	CopyFilesOfParentParams,
	DownloadFileParams,
	FileRecordParams,
	FilesStorageConfigResponse,
	FileUrlParams,
	MultiFileParams,
	PreviewParams,
	RenameFileParams,
	ScanResultParams,
	SingleFileParams,
} from '../dto';
import {
	ConfigResponseMapper,
	CopyFileResponseBuilder,
	FileDtoBuilder,
	FilesStorageMapper,
	PreviewBuilder,
} from '../mapper';

export const FileStorageAuthorizationContext = {
	create: AuthorizationContextBuilder.write([AuthorizationContextParamsRequiredPermissions.FILESTORAGE_CREATE]),
	read: AuthorizationContextBuilder.read([AuthorizationContextParamsRequiredPermissions.FILESTORAGE_VIEW]),
	update: AuthorizationContextBuilder.write([AuthorizationContextParamsRequiredPermissions.FILESTORAGE_EDIT]),
	delete: AuthorizationContextBuilder.write([AuthorizationContextParamsRequiredPermissions.FILESTORAGE_REMOVE]),
};

@Injectable()
export class FilesStorageUC {
	constructor(
		private readonly logger: LegacyLogger,
		private readonly authorizationClientAdapter: AuthorizationClientAdapter,
		private readonly httpService: HttpService,
		private readonly filesStorageService: FilesStorageService,
		private readonly previewService: PreviewService,
		// maybe better to pass the request context from controller and avoid em at this place
		private readonly em: EntityManager,
		private readonly domainErrorHandler: DomainErrorHandler
	) {
		this.logger.setContext(FilesStorageUC.name);
	}

	private async checkPermission(
		parentType: FileRecordParentType,
		parentId: EntityId,
		context: AuthorizationContextParams
	): Promise<void> {
		const referenceType = FilesStorageMapper.mapToAllowedAuthorizationEntityType(parentType);

		await this.authorizationClientAdapter.checkPermissionsByReference(referenceType, parentId, context);
	}

	private async checkPermissions(fileRecords: FileRecord[], context: AuthorizationContextParams): Promise<void> {
		const promises = fileRecords.map(async (fileRecord) => {
			const { parentType, parentId } = fileRecord.getParentInfo();

			await this.checkPermission(parentType, parentId, context);
		});

		await Promise.all(promises);
	}

	public getPublicConfig(): FilesStorageConfigResponse {
		const maxFileSize = this.filesStorageService.getMaxFileSize();

		const configResponse = ConfigResponseMapper.mapToResponse(maxFileSize);

		return configResponse;
	}

	// upload
	public async upload(userId: EntityId, params: FileRecordParams, req: Request): Promise<FileRecord> {
		await this.checkPermission(params.parentType, params.parentId, FileStorageAuthorizationContext.create);

		await this.checkStorageLocation(params.storageLocation, params.storageLocationId);

		const fileRecord = await this.uploadFileWithBusboy(userId, params, req);

		return fileRecord;
	}

	private async checkStorageLocation(storageLocation: StorageLocation, storageLocationId: EntityId): Promise<void> {
		if (storageLocation === StorageLocation.INSTANCE) {
			await this.authorizationClientAdapter.checkPermissionsByReference(
				AuthorizationBodyParamsReferenceType.INSTANCES,
				storageLocationId,
				AuthorizationContextBuilder.write([AuthorizationContextParamsRequiredPermissions.INSTANCE_VIEW])
			);
		}

		if (storageLocation === StorageLocation.SCHOOL) {
			await this.authorizationClientAdapter.checkPermissionsByReference(
				AuthorizationBodyParamsReferenceType.SCHOOLS,
				storageLocationId,
				AuthorizationContextBuilder.write([])
			);
		}
	}

	private uploadFileWithBusboy(userId: EntityId, params: FileRecordParams, req: Request): Promise<FileRecord> {
		const promise = new Promise<FileRecord>((resolve, reject) => {
			const bb = busboy({ headers: req.headers, defParamCharset: 'utf8' });
			let fileRecordPromise: Promise<FileRecord>;

			bb.on('file', (_name, file, info) => {
				const fileDto = FileDtoBuilder.buildFromRequest(info, file);

				fileRecordPromise = RequestContext.createAsync(this.em, () => {
					const record = this.filesStorageService.uploadFile(userId, params, fileDto);

					return record;
				});
			});

			bb.on('finish', () => {
				fileRecordPromise
					.then((result) => resolve(result))
					.catch((error) => {
						req.unpipe(bb);
						reject(error);
					});
			});

			req.pipe(bb);
		});

		return promise;
	}

	public async uploadFromUrl(userId: EntityId, params: FileRecordParams & FileUrlParams): Promise<FileRecord> {
		await this.checkPermission(params.parentType, params.parentId, FileStorageAuthorizationContext.create);

		await this.checkStorageLocation(params.storageLocation, params.storageLocationId);

		const response = await this.getResponse(params);

		const fileDto = FileDtoBuilder.buildFromAxiosResponse(params.fileName, response);

		const fileRecord = await this.filesStorageService.uploadFile(userId, params, fileDto);

		return fileRecord;
	}

	private async getResponse(
		params: FileRecordParams & FileUrlParams
	): Promise<AxiosResponse<internal.Readable, unknown>> {
		const config: AxiosRequestConfig = {
			headers: params.headers,
			responseType: 'stream',
		};

		try {
			const responseStream = this.httpService.get<internal.Readable>(encodeURI(params.url), config);

			const response = await firstValueFrom(responseStream);

			/* istanbul ignore next */
			response.data.on('error', (error) => {
				this.domainErrorHandler.exec(error);
			});

			return response;
		} catch (error) {
			this.logger.warn({
				message: 'could not find file by url',
				url: params.url,
				error: error as Error,
			});
			throw new NotFoundException(ErrorType.FILE_NOT_FOUND);
		}
	}

	// download
	public async download(params: DownloadFileParams, bytesRange?: string): Promise<GetFileResponse> {
		const fileRecord = await this.filesStorageService.getFileRecord(params.fileRecordId);
		const { parentType, parentId } = fileRecord.getParentInfo();

		await this.checkPermission(parentType, parentId, FileStorageAuthorizationContext.read);

		return this.filesStorageService.download(fileRecord, params.fileName, bytesRange);
	}

	public async downloadBySecurityToken(token: string): Promise<GetFileResponse> {
		const fileRecord = await this.filesStorageService.getFileRecordBySecurityCheckRequestToken(token);
		const res = await this.filesStorageService.downloadFile(fileRecord);

		return res;
	}

	public async downloadPreview(
		userId: EntityId,
		params: DownloadFileParams,
		previewParams: PreviewParams,
		bytesRange?: string
	): Promise<GetFileResponse> {
		const fileRecord = await this.filesStorageService.getFileRecord(params.fileRecordId);
		const { parentType, parentId } = fileRecord.getParentInfo();

		await this.checkPermission(parentType, parentId, FileStorageAuthorizationContext.read);

		this.filesStorageService.checkFileName(fileRecord, params.fileName);

		const previewFileParams = PreviewBuilder.buildParams(fileRecord, previewParams, bytesRange);

		const result = this.previewService.download(fileRecord, previewFileParams);

		return result;
	}

	// delete
	public async deleteFilesOfParent(params: FileRecordParams): Promise<Counted<FileRecord[]>> {
		await this.checkPermission(params.parentType, params.parentId, FileStorageAuthorizationContext.delete);
		const [fileRecords, count] = await this.filesStorageService.getFileRecordsOfParent(params.parentId);

		await this.previewService.deletePreviews(fileRecords);
		await this.filesStorageService.deleteFilesOfParent(fileRecords);

		return [fileRecords, count];
	}

	public async deleteOneFile(params: SingleFileParams): Promise<FileRecord> {
		const fileRecord = await this.filesStorageService.getFileRecord(params.fileRecordId);
		const { parentType, parentId } = fileRecord.getParentInfo();

		await this.checkPermission(parentType, parentId, FileStorageAuthorizationContext.delete);
		await this.deletePreviewsAndFiles([fileRecord]);

		return fileRecord;
	}

	public async deleteMultipleFiles(params: MultiFileParams): Promise<Counted<FileRecord[]>> {
		const [fileRecords, count] = await this.filesStorageService.getFileRecords(params.fileRecordIds);

		await this.checkPermissions(fileRecords, FileStorageAuthorizationContext.delete);

		await this.deletePreviewsAndFiles(fileRecords);

		return [fileRecords, count];
	}

	private async deletePreviewsAndFiles(fileRecords: FileRecord[]): Promise<void> {
		await this.previewService.deletePreviews(fileRecords);
		await this.filesStorageService.delete(fileRecords);
	}

	// restore
	public async restoreFilesOfParent(params: FileRecordParams): Promise<Counted<FileRecord[]>> {
		await this.checkPermission(params.parentType, params.parentId, FileStorageAuthorizationContext.create);
		const [fileRecords, count] = await this.filesStorageService.restoreFilesOfParent(params);

		return [fileRecords, count];
	}

	public async restoreOneFile(params: SingleFileParams): Promise<FileRecord> {
		const fileRecord = await this.filesStorageService.getFileRecordMarkedForDelete(params.fileRecordId);
		const { parentType, parentId } = fileRecord.getParentInfo();

		await this.checkPermission(parentType, parentId, FileStorageAuthorizationContext.create);
		await this.filesStorageService.restore([fileRecord]);

		return fileRecord;
	}

	// copy
	public async copyFilesOfParent(
		userId: string,
		params: FileRecordParams,
		copyFilesParams: CopyFilesOfParentParams
	): Promise<Counted<CopyFileResponse[]>> {
		await Promise.all([
			this.checkPermission(params.parentType, params.parentId, FileStorageAuthorizationContext.create),
			this.checkPermission(
				copyFilesParams.target.parentType,
				copyFilesParams.target.parentId,
				FileStorageAuthorizationContext.create
			),
		]);

		const copyFileResults = await this.filesStorageService.copyFilesOfParent(userId, params, copyFilesParams.target);
		const copyFileResponses = copyFileResults[0].map((copyFileResult) =>
			CopyFileResponseBuilder.build(copyFileResult.id, copyFileResult.sourceId, copyFileResult.name)
		);
		const countedFileResponses: Counted<CopyFileResponse[]> = [copyFileResponses, copyFileResults[1]];

		return countedFileResponses;
	}

	public async copyOneFile(
		userId: string,
		params: SingleFileParams,
		copyFileParams: CopyFileParams
	): Promise<CopyFileResponse> {
		const fileRecord = await this.filesStorageService.getFileRecord(params.fileRecordId);
		const { parentType, parentId } = fileRecord.getParentInfo();

		await Promise.all([
			this.checkPermission(parentType, parentId, FileStorageAuthorizationContext.create),
			this.checkPermission(
				copyFileParams.target.parentType,
				copyFileParams.target.parentId,
				FileStorageAuthorizationContext.create
			),
		]);

		const response = await this.filesStorageService.copy(userId, [fileRecord], copyFileParams.target);

		return response[0];
	}

	// update
	public async patchFilename(params: SingleFileParams, data: RenameFileParams): Promise<FileRecord> {
		const fileRecord = await this.filesStorageService.getFileRecord(params.fileRecordId);
		const { parentType, parentId } = fileRecord.getParentInfo();

		await this.checkPermission(parentType, parentId, FileStorageAuthorizationContext.update);

		const modifiedFileRecord = await this.filesStorageService.patchFilename(fileRecord, data.fileName);

		return modifiedFileRecord;
	}

	public async updateSecurityStatus(token: string, scanResultParams: ScanResultParams): Promise<void> {
		// No authorisation is possible atm.
		await this.filesStorageService.updateSecurityStatus(token, scanResultParams);
	}

	// get
	public async getFileRecordsOfParent(params: FileRecordParams): Promise<Counted<FileRecord[]>> {
		await this.checkPermission(params.parentType, params.parentId, FileStorageAuthorizationContext.read);

		const countedFileRecords = await this.filesStorageService.getFileRecordsOfParent(params.parentId);

		return countedFileRecords;
	}
}
