import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Counted, EntityId, FileRecord, FileRecordParentType, IPermissionContext } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { AuthorizationService } from '@src/modules/authorization';
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
	SingleFileParams,
} from '../controller/dto';
import { ErrorType } from '../error';
import { PermissionContexts } from '../files-storage.const';
import { IFile } from '../interface/file';
import { FilesStorageMapper } from '../mapper';
import { IFileBuilder } from '../mapper/ifile-builder.builder';
import { FilesStorageService } from '../service/files-storage.service';

@Injectable()
export class FilesStorageUC {
	constructor(
		private logger: Logger,
		private readonly authorizationService: AuthorizationService,
		private readonly httpService: HttpService,
		private readonly filesStorageService: FilesStorageService
	) {
		this.logger.setContext(FilesStorageUC.name);
	}

	private async addRequestStreamToRequestPipe(
		userId: EntityId,
		params: FileRecordParams,
		req: Request
	): Promise<FileRecord> {
		const result = await new Promise((resolve, reject) => {
			const requestStream = busboy({ headers: req.headers, defParamCharset: 'utf8' });

			// eslint-disable-next-line @typescript-eslint/no-misused-promises
			requestStream.on('file', async (_name, file, info): Promise<void> => {
				const fileDescription: IFile = IFileBuilder.buildFromRequest(info, req, file);

				try {
					const record = await this.filesStorageService.uploadFile(userId, params, fileDescription);
					resolve(record);
				} catch (error) {
					requestStream.emit('error', error);
				}
			});

			requestStream.on('error', (e) => {
				reject(new BadRequestException(e, `${FilesStorageUC.name}:upload requestStream`));
			});

			req.pipe(requestStream);
		});

		return result as FileRecord;
	}

	public async upload(userId: EntityId, params: FileRecordParams, req: Request) {
		await this.checkPermission(userId, params.parentType, params.parentId, PermissionContexts.create);

		const result = await this.addRequestStreamToRequestPipe(userId, params, req);

		return result;
	}

	private async getResponse(
		params: FileRecordParams & FileUrlParams
	): Promise<AxiosResponse<internal.Readable, unknown>> {
		const config: AxiosRequestConfig = {
			headers: params.headers,
			responseType: 'stream',
		};

		const responseStream = this.httpService.get<internal.Readable>(encodeURI(params.url), config);

		const response = await firstValueFrom(responseStream);

		response.data.on('error', (error) => {
			throw error;
		});

		return response;
	}

	public async uploadFromUrl(userId: EntityId, params: FileRecordParams & FileUrlParams) {
		await this.checkPermission(userId, params.parentType, params.parentId, PermissionContexts.create);

		try {
			const response = await this.getResponse(params);

			const fileDescription: IFile = IFileBuilder.buildFromAxiosResponse(params.fileName, response);

			const result = await this.filesStorageService.uploadFile(userId, params, fileDescription);

			return result;
		} catch (error) {
			this.logger.warn(`could not find file by url: ${params.url}`, error);
			throw new NotFoundException(ErrorType.FILE_NOT_FOUND);
		}
	}

	private async checkPermission(
		userId: EntityId,
		parentType: FileRecordParentType,
		parentId: EntityId,
		context: IPermissionContext
	) {
		const allowedType = FilesStorageMapper.mapToAllowedAuthorizationEntityType(parentType);
		await this.authorizationService.checkPermissionByReferences(userId, allowedType, parentId, context);
	}

	public async download(userId: EntityId, params: DownloadFileParams) {
		const singleFileParams = FilesStorageMapper.mapToSingleFileParams(params);
		const fileRecord = await this.filesStorageService.getFileRecord(singleFileParams);

		await this.checkPermission(userId, fileRecord.parentType, fileRecord.parentId, PermissionContexts.read);

		const response = this.filesStorageService.download(fileRecord, params);

		return response;
	}

	public async downloadBySecurityToken(token: string) {
		const fileRecord = await this.filesStorageService.getFileRecordBySecurityCheckRequestToken(token);
		const res = await this.filesStorageService.downloadFile(fileRecord.schoolId, fileRecord.id);

		return res;
	}

	public async deleteFilesOfParent(userId: EntityId, params: FileRecordParams): Promise<Counted<FileRecord[]>> {
		await this.checkPermission(userId, params.parentType, params.parentId, PermissionContexts.delete);
		const [fileRecords, count] = await this.filesStorageService.deleteFilesOfParent(params);

		return [fileRecords, count];
	}

	public async deleteOneFile(userId: EntityId, params: SingleFileParams): Promise<FileRecord> {
		const fileRecord = await this.filesStorageService.getFileRecord(params);

		await this.checkPermission(userId, fileRecord.parentType, fileRecord.parentId, PermissionContexts.delete);
		await this.filesStorageService.delete([fileRecord]);

		return fileRecord;
	}

	public async restoreFilesOfParent(userId: EntityId, params: FileRecordParams): Promise<Counted<FileRecord[]>> {
		await this.checkPermission(userId, params.parentType, params.parentId, PermissionContexts.create);
		const [fileRecords, count] = await this.filesStorageService.restoreFilesOfParent(params);

		return [fileRecords, count];
	}

	public async restoreOneFile(userId: EntityId, params: SingleFileParams): Promise<FileRecord> {
		const fileRecord = await this.filesStorageService.getFileRecordMarkedForDelete(params);

		await this.checkPermission(userId, fileRecord.parentType, fileRecord.parentId, PermissionContexts.create);
		await this.filesStorageService.restore([fileRecord]);

		return fileRecord;
	}

	public async copyFilesOfParent(
		userId: string,
		params: FileRecordParams,
		copyFilesParams: CopyFilesOfParentParams
	): Promise<Counted<CopyFileResponse[]>> {
		await Promise.all([
			this.checkPermission(userId, params.parentType, params.parentId, PermissionContexts.create),
			this.checkPermission(
				userId,
				copyFilesParams.target.parentType,
				copyFilesParams.target.parentId,
				PermissionContexts.create
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
		await Promise.all([
			this.checkPermission(userId, fileRecord.parentType, fileRecord.parentId, PermissionContexts.create),
			this.checkPermission(
				userId,
				copyFileParams.target.parentType,
				copyFileParams.target.parentId,
				PermissionContexts.create
			),
		]);

		const response = await this.filesStorageService.copy(userId, [fileRecord], copyFileParams.target);

		return response[0];
	}
}
