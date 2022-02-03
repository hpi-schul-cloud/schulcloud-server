import { ForbiddenException, Injectable, StreamableFile } from '@nestjs/common';
import { ICurrentUser } from '@shared/domain';
import * as path from 'path';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import { FileMetaDto } from '../controller/dto/file-upload.dto';
import { IFile } from '../interface/file';

@Injectable()
export class FilesStorageUC {
	constructor(private readonly uploadService: S3ClientAdapter) {}

	/**
	 * upload file to private bucket storage
	 * @param currentUser
	 * @param metadata
	 * @param file
	 * @returns
	 */
	async upload(currentUser: ICurrentUser, metadata: FileMetaDto, file: Express.Multer.File) {
		// 5f2987e020834114b8efd6f8
		// check permissions
		// this.hasPermissions(currentUser, metadata.schoolId);

		const { schoolId } = currentUser;

		const reqFile: IFile = {
			fileName: file.originalname,
			buffer: file.buffer,
			size: file.size,
			contentType: file.mimetype,
		};

		const folder = path.join(schoolId, metadata.targetId);
		const result = await this.uploadService.uploadFile(folder, reqFile);

		return result;
	}

	/**
	 * * get file from private bucket storage
	 * @param currentUser
	 * @param schoolId
	 * @param uuid
	 * @returns
	 */
	async download(currentUser: ICurrentUser, schoolId: string, uuid: string) {
		// 5f2987e020834114b8efd6f8
		// check permissions
		// this.hasPermissions(currentUser, schoolId);

		schoolId = currentUser.schoolId;
		const patch = path.join(schoolId, uuid);

		const res = await this.uploadService.getFile(patch);
		return new StreamableFile(res.data, { type: res.contentType });
	}

	hasPermissions(currentUser: ICurrentUser, schoolId: string) {
		if (schoolId !== currentUser.schoolId) {
			throw new ForbiddenException();
		}
	}
}
