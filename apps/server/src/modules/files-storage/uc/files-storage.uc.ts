import { HttpService } from '@nestjs/axios';
import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	NotAcceptableException,
	NotFoundException,
} from '@nestjs/common';
import { Counted, EntityId, FileRecord, FileRecordParentType, IPermissionContext, ScanStatus } from '@shared/domain';
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
import { ErrorType, PermissionContexts } from '../files-storage.const';
import { ICopyFiles } from '../interface';
import { IFile } from '../interface/file';
import { FileStorageMapper } from '../mapper/parent-type.mapper';

@Injectable()
export class FilesStorageUC {
	constructor(
		private readonly storageClient: S3ClientAdapter,
		private readonly fileRecordRepo: FileRecordRepo,
		private readonly antivirusService: AntivirusService,
		private logger: Logger,
		private readonly authorizationService: AuthorizationService,
		private readonly httpService: HttpService
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
				const fileDescription: IFile = {
					name: info.filename,
					buffer: file,
					size: Number(req.get('content-length')),
					mimeType: info.mimeType,
				};
				try {
					const record = await this.uploadFile(userId, params, fileDescription);
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
		const [fileRecords] = await this.fileRecordRepo.findBySchoolIdAndParentId(params.schoolId, params.parentId);
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

	private async downloadFile(schoolId: EntityId, fileRecordId: EntityId) {
		const pathToFile = this.createPath(schoolId, fileRecordId);
		const res = await this.storageClient.get(pathToFile);

		return res;
	}

	private async checkPermission(
		userId: EntityId,
		parentType: FileRecordParentType,
		parentId: EntityId,
		context: IPermissionContext
	) {
		const allowedType = FileStorageMapper.mapToAllowedAuthorizationEntityType(parentType);
		await this.authorizationService.checkPermissionByReferences(userId, allowedType, parentId, context);
	}

	private checkFileName(entity: FileRecord, params: DownloadFileParams): void | NotFoundException {
		if (entity.name !== params.fileName) {
			this.logger.warn(`could not find file with id: ${entity.id} by filename`);
			throw new NotFoundException(ErrorType.FILE_NOT_FOUND);
		}
	}

	private checkScanStatus(entity: FileRecord): void | NotAcceptableException {
		if (entity.securityCheck.status === ScanStatus.BLOCKED) {
			this.logger.warn(`file is blocked with id: ${entity.id}`);
			throw new NotAcceptableException(ErrorType.FILE_IS_BLOCKED);
		}
	}

	public async download(userId: EntityId, params: DownloadFileParams) {
		const entity = await this.fileRecordRepo.findOneById(params.fileRecordId);

		await this.checkPermission(userId, entity.parentType, entity.parentId, PermissionContexts.read);

		this.checkFileName(entity, params);
		this.checkScanStatus(entity);
		const res = await this.downloadFile(entity.schoolId, entity.id);

		return res;
	}

	public async downloadBySecurityToken(token: string) {
		const entity = await this.fileRecordRepo.findBySecurityCheckRequestToken(token);
		const res = await this.downloadFile(entity.schoolId, entity.id);

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

	private async markForDelete(fileRecords: FileRecord[]): Promise<void> {
		fileRecords.forEach((fileRecord) => {
			fileRecord.markForDelete();
		});

		await this.fileRecordRepo.save(fileRecords);
	}

	private async unmarkForDelete(fileRecords: FileRecord[]): Promise<void> {
		fileRecords.forEach((fileRecord) => {
			fileRecord.unmarkForDelete();
		});

		await this.fileRecordRepo.save(fileRecords);
	}

	private async delete(fileRecords: FileRecord[]) {
		this.logger.debug({ action: 'delete', fileRecords });

		await this.markForDelete(fileRecords);
		try {
			const paths = fileRecords.map((fileRecord) => this.createPath(fileRecord.schoolId, fileRecord.id));

			await this.storageClient.delete(paths);
		} catch (err) {
			await this.unmarkForDelete(fileRecords);

			throw new InternalServerErrorException(err, `${FilesStorageUC.name}:delete`);
		}
	}

	public async deleteFilesOfParent(userId: EntityId, params: FileRecordParams): Promise<Counted<FileRecord[]>> {
		await this.checkPermission(userId, params.parentType, params.parentId, PermissionContexts.delete);
		const [fileRecords, count] = await this.fileRecordRepo.findBySchoolIdAndParentId(params.schoolId, params.parentId);
		if (count > 0) {
			await this.delete(fileRecords);
		}

		return [fileRecords, count];
	}

	public async deleteOneFile(userId: EntityId, params: SingleFileParams): Promise<FileRecord> {
		const fileRecord = await this.fileRecordRepo.findOneById(params.fileRecordId);
		await this.checkPermission(userId, fileRecord.parentType, fileRecord.parentId, PermissionContexts.delete);
		await this.delete([fileRecord]);

		return fileRecord;
	}

	public async restoreFilesOfParent(userId: EntityId, params: FileRecordParams): Promise<Counted<FileRecord[]>> {
		await this.checkPermission(userId, params.parentType, params.parentId, PermissionContexts.create);
		const [fileRecords, count] = await this.fileRecordRepo.findBySchoolIdAndParentIdAndMarkedForDelete(
			params.schoolId,
			params.parentId
		);
		if (count > 0) {
			await this.restore(fileRecords);
		}
		return [fileRecords, count];
	}

	public async restoreOneFile(userId: EntityId, params: SingleFileParams): Promise<FileRecord> {
		const fileRecord = await this.fileRecordRepo.findOneByIdMarkedForDelete(params.fileRecordId);
		await this.checkPermission(userId, fileRecord.parentType, fileRecord.parentId, PermissionContexts.create);
		await this.restore([fileRecord]);

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

		const [fileRecords, count] = await this.fileRecordRepo.findBySchoolIdAndParentId(params.schoolId, params.parentId);

		if (count === 0) {
			return [[], 0];
		}

		const response = await this.copy(userId, fileRecords, copyFilesParams.target);

		return [response, count];
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

		const response = await this.copy(userId, [fileRecord], copyFileParams.target);

		return response[0];
	}

	private async copy(
		userId: EntityId,
		sourceFileRecords: FileRecord[],
		targetParams: FileRecordParams
	): Promise<CopyFileResponse[]> {
		this.logger.debug({ action: 'copy', sourceFileRecords, targetParams });
		const responseEntities: CopyFileResponse[] = [];
		const newRecords: FileRecord[] = [];
		const paths: Array<ICopyFiles> = [];

		await Promise.all(
			sourceFileRecords.map(async (item) => {
				if (item.securityCheck.status !== ScanStatus.BLOCKED && !item.deletedSince) {
					const entity = this.getNewFileRecord(item.name, item.size, item.mimeType, targetParams, userId);
					if (item.securityCheck.status !== ScanStatus.PENDING) {
						entity.securityCheck = item.securityCheck;
					}

					await this.fileRecordRepo.save(entity);
					newRecords.push(entity);
					responseEntities.push(new CopyFileResponse({ id: entity.id, sourceId: item.id, name: entity.name }));
					paths.push({
						//
						sourcePath: this.createPath(item.schoolId, item.id),
						targetPath: this.createPath(entity.schoolId, entity.id),
					});
				}
			})
		);

		try {
			await this.storageClient.copy(paths);
			const pendedFileRecords = newRecords.filter((item) => {
				if (item.securityCheck.status === ScanStatus.PENDING) {
					return this.antivirusService.send(item);
				}
				return false;
			});

			await Promise.all(pendedFileRecords);
			return responseEntities;
		} catch (error) {
			await this.fileRecordRepo.delete(newRecords);
			throw error;
		}
	}

	private async restore(fileRecords: FileRecord[]) {
		this.logger.debug({ action: 'restore', fileRecords });

		await this.unmarkForDelete(fileRecords);
		try {
			const paths = fileRecords.map((fileRecord) => this.createPath(fileRecord.schoolId, fileRecord.id));

			await this.storageClient.restore(paths);
		} catch (err) {
			await this.markForDelete(fileRecords);
			throw new InternalServerErrorException(err, `${FilesStorageUC.name}:restore`);
		}
	}
}
