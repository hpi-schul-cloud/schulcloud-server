import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as path from 'path';
import { Request } from 'express';
import { FileRecordRepo } from '@shared/repo';
import { EntityId, FileRecord } from '@shared/domain';
import busboy from 'busboy';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import { FileDownloadDto, FileMetaDto } from '../controller/dto/file.dto';
import { IFile } from '../interface/file';

@Injectable()
export class FilesStorageUC {
	constructor(private readonly storageClient: S3ClientAdapter, private readonly fileRecordRepo: FileRecordRepo) {}

	async upload(userId: EntityId, params: FileMetaDto, req: Request) {
		// @TODO check permissions of schoolId by user
		// @TODO scan virus on demand?
		// @TODO add thumbnail on demand
		try {
			let record!: FileRecord;

			const result = await new Promise((resolve, reject) => {
				const bb = busboy({ headers: req.headers });
				// eslint-disable-next-line @typescript-eslint/no-misused-promises
				bb.on('file', async (_name, file, info): Promise<void> => {
					const { filename, mimeType } = info;

					const size = Number(req.get('content-length'));
					const contentType = mimeType;
					const fileName = filename;
					const fileR: IFile = {
						name: fileName,
						buffer: file,
						size,
						type: contentType,
					};
					record = this.getFileRecord(userId, params, fileR);
					await this.fileRecordRepo.save(record);

					const folder = path.join(params.schoolId, record.id);
					const s3Res = await this.storageClient.uploadFile(folder, fileR);

					return resolve({ s3Res, record });
				});

				bb.on('close', () => {
					resolve(record);
				});
				bb.on('error', (e) => {
					reject(e);
				});

				req.pipe(bb);
			});

			return result;
		} catch (error) {
			throw new BadRequestException(error);
		}
	}

	async download(userId: EntityId, params: FileDownloadDto) {
		try {
			const entity = await this.fileRecordRepo.findOneById(params.fileRecordId);
			if (entity.name !== params.fileName) {
				throw new NotFoundException('File not found');
			}

			// @TODO check permissions of schoolId by user
			const pathToFile = path.join(entity.schoolId, entity.id, entity.name);
			const res = await this.storageClient.getFile(pathToFile);

			return res;
		} catch (error) {
			throw new BadRequestException(error);
		}
	}

	getFileRecord(userId: EntityId, params: FileMetaDto, file: IFile) {
		const entity = new FileRecord({
			size: file.size,
			name: file.name,
			type: file.type,
			targetType: params.targetType,
			targetId: params.targetId,
			creatorId: userId,
			schoolId: params.schoolId,
		});
		return entity;
	}
}
