import { S3ClientAdapter } from '@infra/s3-client';
import { IFileStats, ITemporaryFile, ITemporaryFileStorage, IUser } from '@lumieducation/h5p-server';
import {
	HttpException,
	Inject,
	Injectable,
	InternalServerErrorException,
	NotAcceptableException,
	NotFoundException,
} from '@nestjs/common';
import { ErrorUtils } from '@src/core/error/utils';
import { ReadStream } from 'fs';
import { Readable } from 'stream';
import { H5pFileDto } from '../controller/dto/h5p-file.dto';
import { H5P_CONTENT_S3_CONNECTION } from '../h5p-editor.config';

@Injectable()
export class TemporaryFileStorage implements ITemporaryFileStorage {
	constructor(@Inject(H5P_CONTENT_S3_CONNECTION) private readonly s3Client: S3ClientAdapter) {}

	private checkFilename(filename: string): void {
		filename = filename.split('.').slice(0, -1).join('.');
		if (/^[a-zA-Z0-9/._-]*$/.test(filename) && !filename.includes('..') && !filename.startsWith('/')) {
			return;
		}
		throw new HttpException('message', 406, {
			cause: new NotAcceptableException(`Filename contains forbidden characters ${filename}`),
		});
	}

	public async deleteFile(filename: string, userId: string): Promise<void> {
		this.checkFilename(filename);
		const filePath = this.getFilePath(userId, filename);
		await this.s3Client.delete([filePath]);
	}

	public async fileExists(filename: string, user: IUser): Promise<boolean> {
		this.checkFilename(filename);

		const filePath = this.getFilePath(user.id, filename);

		try {
			await this.s3Client.get(filePath);
		} catch (err) {
			if (err instanceof NotFoundException) {
				return false;
			}

			throw new InternalServerErrorException(
				null,
				ErrorUtils.createHttpExceptionOptions(err, 'TemporaryFileStorage:fileExists')
			);
		}

		return true;
	}

	public async getFileStats(filename: string, user: IUser): Promise<IFileStats> {
		const filePath = this.getFilePath(user.id, filename);
		const { ContentLength, LastModified } = await this.s3Client.head(filePath);

		if (ContentLength === undefined || LastModified === undefined) {
			throw new InternalServerErrorException(
				{ ContentLength, LastModified },
				'TemporaryFileStorage:getFileStats ContentLength or LastModified are undefined'
			);
		}

		const fileStats: IFileStats = {
			birthtime: LastModified,
			size: ContentLength,
		};

		return fileStats;
	}

	public async getFileStream(
		filename: string,
		user: IUser,
		rangeStart?: number | undefined,
		rangeEnd?: number | undefined
	): Promise<Readable> {
		const filePath = this.getFilePath(user.id, filename);

		let range: string | undefined;
		if (rangeStart && rangeEnd) {
			// Closed range
			range = `bytes=${rangeStart}-${rangeEnd}`;
		}

		const { data } = await this.s3Client.get(filePath, range);

		data.pause();

		return data;
	}

	/**
	 * @deprecated do not use this function
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async listFiles(_user?: IUser): Promise<ITemporaryFile[]> {
		// Lumi uses this method to find expired files that should be deleted.
		// Since we use S3 to delete expired files, we just use a barebones implementation
		// Lumi's reference implementation does it the same way

		return Promise.resolve([]);
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

		const file: H5pFileDto = {
			name: filename,
			data: dataStream,
			mimeType: 'application/octet-stream',
		};
		await this.s3Client.create(path, file);

		const temporaryFile: ITemporaryFile = {
			filename,
			ownedByUserId: user.id,
			expiresAt: expirationTime,
		};

		return temporaryFile;
	}

	private getUserPath(userId: string): string {
		const path = `h5p-tempfiles/${userId}/`;
		return path;
	}

	private getFilePath(userId: string, filename: string): string {
		const path = `${this.getUserPath(userId)}${filename}`;
		return path;
	}
}
