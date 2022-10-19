import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Counted, EntityId, FileRecord, FileRecordParentType, IPermissionContext } from '@shared/domain';
import { AntivirusService } from '@shared/infra/antivirus/antivirus.service';
import { FileRecordRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';
import { AuthorizationService } from '@src/modules/authorization';
import busboy from 'busboy';
import { Request } from 'express';
import path from 'path';
import { firstValueFrom } from 'rxjs';
import internal from 'stream';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import { CopyFileResponse } from '../controller/dto';
import {
	CopyFileParams,
	CopyFilesOfParentParams,
	DownloadFileParams,
	FileRecordParams,
	FileUrlParams,
	SingleFileParams,
} from '../controller/dto/file-storage.params';
import { PermissionContexts } from '../files-storage.const';
import { createFile } from '../helper';
import { IFile } from '../interface/file';
import { FilesStorageMapper } from '../mapper/files-storage.mapper';
import { FilesStorageService } from '../service/files-storage.service';

@Injectable()
export class FilesStorageUC {
	constructor(
		private logger: Logger,
		private readonly storageClient: S3ClientAdapter,
		private readonly fileRecordRepo: FileRecordRepo,
		private readonly antivirusService: AntivirusService,
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
				const fileDescription: IFile = createFile(info, req, file);

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

	public async uploadFromUrl(userId: EntityId, params: FileRecordParams & FileUrlParams) {
		await this.checkPermission(userId, params.parentType, params.parentId, PermissionContexts.create);
		try {
			const response = await firstValueFrom(
				this.httpService.get<internal.Readable>(encodeURI(params.url), {
					headers: params.headers,
					responseType: 'stream',
				})
			);

			const fileDescription: IFile = {
				name: decodeURI(params.fileName),
				buffer: response.data,
				size: Number(response.headers['content-length']),
				mimeType: response.headers['content-type'],
			};
			const result = await this.uploadFile(userId, params, fileDescription);

			return result;
		} catch (error) {
			this.logger.warn(`could not find file by url: ${params.url}`, error);
			throw new NotFoundException('FILE_NOT_FOUND');
		}
	}

	private async uploadFile(userId: EntityId, params: FileRecordParams, fileDescription: IFile) {
		const [fileRecords] = await this.filesStorageService.getFileRecordsOfParent(params);
		const fileName = this.checkFilenameExists(fileDescription.name, fileRecords);
		const entity = this.getNewFileRecord(fileName, fileDescription.size, fileDescription.mimeType, params, userId);
		try {
			await this.fileRecordRepo.save(entity);
			const filePath = this.createPath(params.schoolId, entity.id);
			await this.storageClient.create(filePath, fileDescription);
			await this.antivirusService.send(entity);

			return entity;
		} catch (error) {
			await this.fileRecordRepo.delete(entity);
			throw error;
		}
	}

	private getNewFileRecord(name: string, size: number, mimeType: string, params: FileRecordParams, userId: string) {
		const entity = new FileRecord({
			size,
			name,
			mimeType,
			parentType: params.parentType,
			parentId: params.parentId,
			creatorId: userId,
			schoolId: params.schoolId,
		});
		return entity;
	}

	private createPath(schoolId: EntityId, fileRecordId: EntityId): string {
		const pathToFile = [schoolId, fileRecordId].join('/');

		return pathToFile;
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
		const singleFileParams = { fileRecordId: params.fileRecordId };
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

	private checkFilenameExists(filename: string, fileRecords: FileRecord[]): string {
		let counter = 0;
		const filenameObj = path.parse(filename);
		const { name } = filenameObj;
		let newFilename = path.format(filenameObj);
		// eslint-disable-next-line @typescript-eslint/no-loop-func
		while (fileRecords.find((item: FileRecord) => item.name === newFilename)) {
			counter += 1;
			filenameObj.base = counter > 0 ? `${name} (${counter})${filenameObj.ext}` : `${name}${filenameObj.ext}`;
			newFilename = path.format(filenameObj);
		}

		return newFilename;
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
		const fileRecord = await this.fileRecordRepo.findOneById(params.fileRecordId);
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
