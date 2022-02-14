import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as path from 'path';
import { Request } from 'express';
import { FileRecordRepo } from '@shared/repo';
import { FileRecord } from '@shared/domain';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import { FileDownloadDto, FileMetaDto } from '../controller/dto/file.dto';
import { IFile } from '../interface/file';

@Injectable()
export class FilesStorageUC {
	constructor(private readonly storageClient: S3ClientAdapter, private readonly fileRecordRepo: FileRecordRepo) {}

	async upload(userId: string, metadata: FileMetaDto, file: Express.Multer.File) {
		// @TODO check permissions of schoolId by user
		// @TODO scan virus on demand?
		// @TODO add thumbnail on demand
		try {
			const reqFile: IFile = {
				name: file.originalname,
				buffer: file.buffer,
				size: file.size,
				type: file.mimetype,
			};

			const folder = path.join(metadata.schoolId, metadata.targetId);
			const result = await this.storageClient.uploadFile(folder, reqFile);
			// @TODO add metadata to mongodb

			return result;
		} catch (error) {
			throw new BadRequestException(error);
		}
	}

	async uploadAsStream(userId: string, params: FileMetaDto, req: Request) {
		try {
			const size = Number(req.get('content-length'));
			const contentType = req.get('content-type') || 'application/octet-stream';
			const fileName = req.get('x-file-name') || 'unnamed';
			const file: IFile = {
				name: fileName,
				buffer: req as unknown as ReadableStream,
				size,
				type: contentType,
			};
			const record = this.getFileRecord(userId, params, file);
			await this.fileRecordRepo.save(record);

			const folder = path.join(params.schoolId, record.id);
			const res = await this.storageClient.uploadFileAsStream(folder, file);
			return { res, record };
		} catch (error) {
			throw new BadRequestException(error);
		}
	}

	async download(userId: string, params: FileDownloadDto) {
		try {
			const entity = await this.fileRecordRepo.findOneById(params.fileRecordId);
			if (entity.name !== params.fileName) {
				throw new NotFoundException('File not found');
			}

			// @TODO check permissions of schoolId by user
			const patch = path.join(entity.schoolId, entity.id, entity.name);
			const res = await this.storageClient.getFile(patch);

			return res;
		} catch (error) {
			throw new BadRequestException(error);
		}
	}

	getFileRecord(userId: string, params: FileMetaDto, file: IFile) {
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
