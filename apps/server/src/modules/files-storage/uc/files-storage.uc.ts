import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import busboy from 'busboy';
import internal from 'stream';
import { FileRecordRepo } from '@shared/repo';
import { EntityId, FileRecord, ScanStatus } from '@shared/domain';
import path from 'path';
import { AntivirusService } from '@shared/infra/antivirus/antivirus.service';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import { DownloadFileParams, FileRecordParams } from '../controller/dto/file-storage.params';
import { IFile } from '../interface/file';

@Injectable()
export class FilesStorageUC {
	constructor(
		private readonly storageClient: S3ClientAdapter,
		private readonly fileRecordRepo: FileRecordRepo,
		private readonly antivirusService: AntivirusService
	) {}

	async upload(userId: EntityId, params: FileRecordParams, req: Request) {
		// @TODO check permissions of schoolId by user
		try {
			const result = await new Promise((resolve, reject) => {
				const requestStream = busboy({ headers: req.headers });

				// eslint-disable-next-line @typescript-eslint/no-misused-promises
				requestStream.on('file', async (_name, file, info): Promise<void> => {
					const fileDescription = this.createFileDescription(file, info, req);
					try {
						const record = await this.uploadFile(userId, params, fileDescription);
						resolve(record);
					} catch (error) {
						requestStream.emit('error', error);
					}
				});

				requestStream.on('error', (e) => {
					reject(e);
				});
				req.pipe(requestStream);
			});

			return result as FileRecord;
		} catch (error) {
			throw new BadRequestException(error);
		}
	}

	private createFileDescription(file: internal.Readable, info: busboy.FileInfo, req: Request): IFile {
		const size = Number(req.get('content-length'));
		const fileDescription: IFile = {
			name: info.filename,
			buffer: file,
			size,
			mimeType: info.mimeType,
		};

		return fileDescription;
	}

	private async uploadFile(userId: EntityId, params: FileRecordParams, fileDescription: IFile) {
		const [fileRecords] = await this.fileRecordRepo.findBySchoolIdAndParentId(params.schoolId, params.parentId);
		const fileName = this.checkFilenameExists(fileDescription.name, fileRecords);

		const entity = new FileRecord({
			size: fileDescription.size,
			name: fileName,
			mimeType: fileDescription.mimeType,
			parentType: params.parentType,
			parentId: params.parentId,
			creatorId: userId,
			schoolId: params.schoolId,
		});
		try {
			await this.fileRecordRepo.save(entity);
			const folder = [params.schoolId, entity.id].join('/');
			await this.storageClient.create(folder, fileDescription);
			await this.antivirusService.send(entity);
			return entity;
		} catch (error) {
			await this.fileRecordRepo.delete(entity);
			throw error;
		}
	}

	private async downloadFile(schoolId: EntityId, fileRecordId: EntityId) {
		const pathToFile = [schoolId, fileRecordId].join('/');
		const res = await this.storageClient.get(pathToFile);

		return res;
	}

	async download(userId: EntityId, params: DownloadFileParams) {
		try {
			// @TODO check permissions of schoolId by user
			const entity = await this.fileRecordRepo.findOneById(params.fileRecordId);
			if (entity.name !== params.fileName) {
				throw new NotFoundException('File not found');
			} else if (entity.securityCheck.status === ScanStatus.BLOCKED) {
				throw new Error('File is blocked');
			}
			const res = await this.downloadFile(entity.schoolId, entity.id);

			return res;
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}
			throw new BadRequestException(error);
		}
	}

	async downloadBySecurityToken(token: string) {
		try {
			const entity = await this.fileRecordRepo.findBySecurityCheckRequestToken(token);
			const res = await this.downloadFile(entity.schoolId, entity.id);

			return res;
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}
			throw new BadRequestException(error);
		}
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
}
