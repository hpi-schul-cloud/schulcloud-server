import { Injectable, StreamableFile } from '@nestjs/common';
import * as path from 'path';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import { FileMetaDto } from '../controller/dto/file-upload.dto';
import { IFile } from '../interface/file';

@Injectable()
export class FilesStorageUC {
	constructor(private readonly storageClient: S3ClientAdapter) {}

	async upload(userId: string, metadata: FileMetaDto, file: Express.Multer.File) {
		// @TODO check permissions of schoolId by user
		// @TODO scan virus on demand?
		// @TODO add thumbnail on demand
		const reqFile: IFile = {
			fileName: file.originalname,
			buffer: file.buffer,
			size: file.size,
			contentType: file.mimetype,
		};

		const folder = path.join(metadata.schoolId, metadata.targetId);
		const result = await this.storageClient.uploadFile(folder, reqFile);
		// @TODO add metadata to mongodb
		return result;
	}

	async download(userId: string, schoolId: string, uuid: string) {
		// @TODO check permissions of schoolId by user
		const patch = path.join(schoolId, uuid);

		const res = await this.storageClient.getFile(patch);
		return new StreamableFile(res.data, { type: res.contentType });
	}
}
