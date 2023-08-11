import { ITemporaryFile, ITemporaryFileStorage, IUser } from '@lumieducation/h5p-server';
import { Inject, Injectable } from '@nestjs/common';
import { S3ClientAdapter } from '@src/modules/files-storage/client/s3-client.adapter';
import { FileDto } from '@src/modules/files-storage/dto/file.dto';
import { ReadStream } from 'fs';
import { Readable } from 'stream';
import { TemporaryFile } from '../entity/temporary-file.entity';
import { TemporaryFileRepo } from '../repo/temporary-file.repo';

@Injectable()
export class TemporaryFileStorage implements ITemporaryFileStorage {
	constructor(
		private readonly repo: TemporaryFileRepo,
		@Inject('S3ClientAdapter_Content') private readonly s3Client: S3ClientAdapter
	) {}

	private checkFilename(filename: string): void {
		if (/^[a-zA-Z0-9/._-]+$/g.test(filename) && !filename.includes('..') && !filename.startsWith('/')) {
			return;
		}
		throw new Error(`Filename contains forbidden characters or is empty: '${filename}'`);
	}

	private getFileInfo(filename: string, userId: string): Promise<TemporaryFile> {
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
		try {
			await this.repo.findByUserAndFilename(user.id, filename);
			return true;
		} catch (error) {
			return false;
		}
	}

	public async getFileStats(filename: string, user: IUser): Promise<TemporaryFile> {
		return this.getFileInfo(filename, user.id);
	}

	public async getFileStream(
		filename: string,
		user: IUser,
		rangeStart?: number | undefined,
		rangeEnd?: number | undefined
	): Promise<Readable> {
		this.checkFilename(filename);
		const tempFile = await this.repo.findByUserAndFilename(user.id, filename);
		const path = this.getFilePath(user.id, filename);
		if (rangeStart === undefined) {
			rangeStart = 0;
		}
		if (rangeEnd === undefined) {
			rangeEnd = tempFile.size - 1;
		}
		const response = await this.s3Client.get(path, `${rangeStart}-${rangeEnd}`);

		return response.data;
	}

	public async listFiles(user?: IUser | undefined): Promise<ITemporaryFile[]> {
		// method is expected to support listing all files in database
		// Lumi uses the variant without a user to search for expired files, so we only return those
		return user ? this.repo.findByUser(user.id) : this.repo.findExpired();
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
			throw new Error('expirationTime must be in the future');
		}

		const path = this.getFilePath(user.id, filename);
		let tempFile: TemporaryFile | undefined;
		try {
			tempFile = await this.repo.findByUserAndFilename(user.id, filename);
			await this.s3Client.delete([path]);
		} catch (err) {
			/* does not exist */
		}
		await this.s3Client.create(
			path,
			new FileDto({ name: path, mimeType: 'application/octet-stream', data: dataStream })
		);

		if (tempFile === undefined) {
			tempFile = new TemporaryFile({
				filename,
				ownedByUserId: user.id,
				expiresAt: expirationTime,
				birthtime: new Date(),
				size: dataStream.bytesRead,
			});
			await this.repo.save(tempFile);
		} else {
			tempFile.expiresAt = expirationTime;
			tempFile.size = dataStream.bytesRead;
			await this.repo.save(tempFile);
		}

		return tempFile;
	}

	private getFilePath(userId: string, filename: string): string {
		if (!userId || !filename) {
			throw new Error('COULD_NOT_CREATE_PATH');
		}

		const path = `h5p-tempfiles/${userId}/${filename}`;
		return path;
	}
}
