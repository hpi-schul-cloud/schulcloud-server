import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import busboy from 'busboy';
import internal from 'stream';
import { FileRecordRepo } from '@shared/repo';
import { EntityId, FileRecord } from '@shared/domain';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import { DownloadFileParams, UploadFileParams } from '../controller/dto/file-storage.params';
import { IFile } from '../interface/file';

@Injectable()
export class FilesStorageUC {
	constructor(private readonly storageClient: S3ClientAdapter, private readonly fileRecordRepo: FileRecordRepo) {}

	async upload(userId: EntityId, params: UploadFileParams, req: Request) {
		// @TODO check permissions of schoolId by user
		// @TODO scan virus on demand?
		// @TODO add thumbnail on demand
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

			return result;
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
			type: info.mimeType, // IFile rename in contentType or mimeType ?
		};

		return fileDescription;
	}

	private async uploadFile(userId: EntityId, params: UploadFileParams, fileDescription: IFile) {
		const entity = new FileRecord({
			size: fileDescription.size,
			name: fileDescription.name,
			type: fileDescription.type,
			targetType: params.targetType,
			targetId: params.targetId,
			creatorId: userId,
			schoolId: params.schoolId,
		});
		try {
			await this.fileRecordRepo.save(entity);
			// todo on error roll back
			const folder = [params.schoolId, entity.id].join('/');
			await this.storageClient.uploadFile(folder, fileDescription);

			return entity;
		} catch (error) {
			await this.fileRecordRepo.delete(entity);
			throw error;
		}
	}

	async download(userId: EntityId, params: DownloadFileParams) {
		try {
			const entity = await this.fileRecordRepo.findOneById(params.fileRecordId);
			if (entity.name !== params.fileName) {
				throw new NotFoundException('File not found');
			}

			// @TODO check permissions of schoolId by user
			const pathToFile = [entity.schoolId, entity.id].join('/');
			const res = await this.storageClient.getFile(pathToFile);

			return res;
		} catch (error) {
			throw new BadRequestException(error);
		}
	}
}
