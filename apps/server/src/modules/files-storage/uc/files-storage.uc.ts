import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Counted, EntityId } from '@shared/domain';
import { LegacyLogger } from '@src/core/logger';
import { AuthorizationContext, AuthorizationService } from '@src/modules/authorization';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import busboy from 'busboy';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';
import internal from 'stream';
import {
	CopyFileParams,
	CopyFileResponse,
	CopyFilesOfParentParams,
	DownloadFileParams,
	FileRecordParams,
	FileUrlParams,
	RenameFileParams,
	ScanResultParams,
	SingleFileParams,
} from '../controller/dto';
import { FileRecord, FileRecordParentType } from '../entity';
import { ErrorType } from '../error';
import { FileStorageAuthorizationContext } from '../files-storage.const';
import { IGetFileResponse } from '../interface';
import { FileDtoBuilder, FilesStorageMapper } from '../mapper';
import { FilesStorageService } from '../service/files-storage.service';

@Injectable()
export class FilesStorageUC {
	constructor(
		private logger: LegacyLogger,
		private readonly authorizationService: AuthorizationService,
		private readonly httpService: HttpService,
		private readonly filesStorageService: FilesStorageService
	) {
		this.logger.setContext(FilesStorageUC.name);
	}

	private async checkPermission(
		userId: EntityId,
		parentType: FileRecordParentType,
		parentId: EntityId,
		context: AuthorizationContext
	) {
		const allowedType = FilesStorageMapper.mapToAllowedAuthorizationEntityType(parentType);
		await this.authorizationService.checkPermissionByReferences(userId, allowedType, parentId, context);
	}

	// upload
	public async upload(userId: EntityId, params: FileRecordParams, req: Request): Promise<FileRecord> {
		await this.checkPermission(userId, params.parentType, params.parentId, FileStorageAuthorizationContext.create);

		const fileRecord = await this.uploadFileWithBusboy(userId, params, req);

		return fileRecord;
	}

	private async uploadFileWithBusboy(userId: EntityId, params: FileRecordParams, req: Request): Promise<FileRecord> {
		const promise = new Promise<FileRecord>((resolve, reject) => {
			const bb = busboy({ headers: req.headers, defParamCharset: 'utf8' });

			// eslint-disable-next-line @typescript-eslint/no-misused-promises
			bb.on('file', async (_name, file, info) => {
				const fileDto = FileDtoBuilder.buildFromRequest(info, file);

				try {
					const record = await this.filesStorageService.uploadFile(userId, params, fileDto);
					resolve(record);
				} catch (error) {
					req.unpipe(bb);
					reject(error);
				}
			});

			req.pipe(bb);
		});

		return promise;
	}

	public async uploadFromUrl(userId: EntityId, params: FileRecordParams & FileUrlParams) {
		await this.checkPermission(userId, params.parentType, params.parentId, FileStorageAuthorizationContext.create);

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
				throw error;
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
	public async download(userId: EntityId, params: DownloadFileParams, bytesRange?: string): Promise<IGetFileResponse> {
		const singleFileParams = FilesStorageMapper.mapToSingleFileParams(params);
		const fileRecord = await this.filesStorageService.getFileRecord(singleFileParams);
		const { parentType, parentId } = fileRecord.getParentInfo();

		await this.checkPermission(userId, parentType, parentId, FileStorageAuthorizationContext.read);

		return this.filesStorageService.download(fileRecord, params, bytesRange);
	}

	public async downloadBySecurityToken(token: string): Promise<IGetFileResponse> {
		const fileRecord = await this.filesStorageService.getFileRecordBySecurityCheckRequestToken(token);
		const res = await this.filesStorageService.downloadFile(fileRecord.getSchoolId(), fileRecord.id);

		return res;
	}

	// delete
	public async deleteFilesOfParent(userId: EntityId, params: FileRecordParams): Promise<Counted<FileRecord[]>> {
		await this.checkPermission(userId, params.parentType, params.parentId, FileStorageAuthorizationContext.delete);
		const [fileRecords, count] = await this.filesStorageService.deleteFilesOfParent(params);

		return [fileRecords, count];
	}

	public async deleteOneFile(userId: EntityId, params: SingleFileParams): Promise<FileRecord> {
		const fileRecord = await this.filesStorageService.getFileRecord(params);
		const { parentType, parentId } = fileRecord.getParentInfo();

		await this.checkPermission(userId, parentType, parentId, FileStorageAuthorizationContext.delete);
		await this.filesStorageService.delete([fileRecord]);

		return fileRecord;
	}

	// restore
	public async restoreFilesOfParent(userId: EntityId, params: FileRecordParams): Promise<Counted<FileRecord[]>> {
		await this.checkPermission(userId, params.parentType, params.parentId, FileStorageAuthorizationContext.create);
		const [fileRecords, count] = await this.filesStorageService.restoreFilesOfParent(params);

		return [fileRecords, count];
	}

	public async restoreOneFile(userId: EntityId, params: SingleFileParams): Promise<FileRecord> {
		const fileRecord = await this.filesStorageService.getFileRecordMarkedForDelete(params);
		const { parentType, parentId } = fileRecord.getParentInfo();

		await this.checkPermission(userId, parentType, parentId, FileStorageAuthorizationContext.create);
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
			this.checkPermission(userId, params.parentType, params.parentId, FileStorageAuthorizationContext.create),
			this.checkPermission(
				userId,
				copyFilesParams.target.parentType,
				copyFilesParams.target.parentId,
				FileStorageAuthorizationContext.create
			),
		]);

		const response = await this.filesStorageService.copyFilesOfParent(userId, params, copyFilesParams);

		return response;
	}

	public async copyOneFile(
		userId: string,
		params: SingleFileParams,
		copyFileParams: CopyFileParams
	): Promise<CopyFileResponse> {
		const fileRecord = await this.filesStorageService.getFileRecord(params);
		const { parentType, parentId } = fileRecord.getParentInfo();

		await Promise.all([
			this.checkPermission(userId, parentType, parentId, FileStorageAuthorizationContext.create),
			this.checkPermission(
				userId,
				copyFileParams.target.parentType,
				copyFileParams.target.parentId,
				FileStorageAuthorizationContext.create
			),
		]);

		const response = await this.filesStorageService.copy(userId, [fileRecord], copyFileParams.target);

		return response[0];
	}

	// update
	public async patchFilename(userId: EntityId, params: SingleFileParams, data: RenameFileParams): Promise<FileRecord> {
		const fileRecord = await this.filesStorageService.getFileRecord(params);
		const { parentType, parentId } = fileRecord.getParentInfo();

		await this.checkPermission(userId, parentType, parentId, FileStorageAuthorizationContext.update);

		const modifiedFileRecord = await this.filesStorageService.patchFilename(fileRecord, data);

		return modifiedFileRecord;
	}

	public async updateSecurityStatus(token: string, scanResultDto: ScanResultParams): Promise<void> {
		// No authorisation is possible atm.
		await this.filesStorageService.updateSecurityStatus(token, scanResultDto);
	}

	// get
	public async getFileRecordsOfParent(userId: EntityId, params: FileRecordParams): Promise<Counted<FileRecord[]>> {
		await this.checkPermission(userId, params.parentType, params.parentId, FileStorageAuthorizationContext.read);

		const countedFileRecords = await this.filesStorageService.getFileRecordsOfParent(params);

		return countedFileRecords;
	}
}
