import { ITemporaryFile, ITemporaryFileStorage, IUser } from '@lumieducation/h5p-server';
import { Inject, Injectable, NotAcceptableException } from '@nestjs/common';
import { S3ClientAdapter } from '@infra/s3-client';
import { ReadStream } from 'fs';
import { Readable } from 'stream';
import { H5pFileDto } from '../controller/dto/h5p-file.dto';
import { H5pEditorTempFile } from '../entity/h5p-editor-tempfile.entity';
import { H5P_CONTENT_S3_CONNECTION } from '../h5p-editor.config';
import { TemporaryFileRepo } from '../repo/temporary-file.repo';

@Injectable()
export class TemporaryFileStorage implements ITemporaryFileStorage {
	constructor(
		private readonly repo: TemporaryFileRepo,
		@Inject(H5P_CONTENT_S3_CONNECTION) private readonly s3Client: S3ClientAdapter
	) {}

	private checkFilename(filename: string): void {
		if (!/^[a-zA-Z0-9/._-]+$/g.test(filename) && filename.includes('..') && filename.startsWith('/')) {
			throw new NotAcceptableException(`Filename contains forbidden characters or is empty: '${filename}'`);
		}
	}

	private getFileInfo(filename: string, userId: string): Promise<H5pEditorTempFile> {
		this.checkFilename(filename);
		return this.repo.findByUserAndFilename(userId, filename);
	}

	public async deleteFile(filename: string, userId: string): Promise<void> {
		this.checkFilename(filename);
		const meta = await this.repo.findByUserAndFilename(userId, filename);
		await this.s3Client.delete([this.getFilePath(userId, filename)]);
		await this.repo.delete(meta);
	}

	public async fileExists(filename: string, user: IUser): Promise<boolean> {
		this.checkFilename(filename);
		const files = await this.repo.findAllByUserAndFilename(user.id, filename);
		const exists = files.length !== 0;
		return exists;
	}

	public async getFileStats(filename: string, user: IUser): Promise<H5pEditorTempFile> {
		return this.getFileInfo(filename, user.id);
	}

	public async getFileStream(
		filename: string,
		user: IUser,
		rangeStart = 0,
		rangeEnd?: number | undefined
	): Promise<Readable> {
		this.checkFilename(filename);
		const tempFile = await this.repo.findByUserAndFilename(user.id, filename);
		const path = this.getFilePath(user.id, filename);
		let rangeEndNew = 0;
		if (rangeEnd === undefined) {
			rangeEndNew = tempFile.size - 1;
		}
		const response = await this.s3Client.get(path, `${rangeStart}-${rangeEndNew}`);

		return response.data;
	}

	public async listFiles(user?: IUser): Promise<ITemporaryFile[]> {
		// method is expected to support listing all files in database
		// Lumi uses the variant without a user to search for expired files, so we only return those

		let files: ITemporaryFile[];
		if (user) {
			files = await this.repo.findByUser(user.id);
		} else {
			files = await this.repo.findExpired();
		}

		return files;
	}

	public async saveFile(
		filename: string,
		dataStream: ReadStream,
		user: IUser,
		expirationTime: Date
	): Promise<ITemporaryFile> {
		this.checkFilename(filename);
		const now = new Date();
		if (expirationTime < now) {
			throw new NotAcceptableException('expirationTime must be in the future');
		}

		const path = this.getFilePath(user.id, filename);
		let tempFile: H5pEditorTempFile | undefined;
		try {
			tempFile = await this.repo.findByUserAndFilename(user.id, filename);
			await this.s3Client.delete([path]);
		} catch (err) {
			/* empty */
		}

		await this.s3Client.create(
			path,
			new H5pFileDto({ name: path, mimeType: 'application/octet-stream', data: dataStream })
		);

		if (tempFile === undefined) {
			tempFile = new H5pEditorTempFile({
				filename,
				ownedByUserId: user.id,
				expiresAt: expirationTime,
				birthtime: new Date(),
				size: dataStream.bytesRead ?? 0,
			});
		} else {
			tempFile.expiresAt = expirationTime;
			tempFile.size = dataStream.bytesRead ?? 0;
		}

		await this.repo.save(tempFile);

		return tempFile;
	}

	private getFilePath(userId: string, filename: string): string {
		const path = `h5p-tempfiles/${userId}/${filename}`;

		return path;
	}
}
