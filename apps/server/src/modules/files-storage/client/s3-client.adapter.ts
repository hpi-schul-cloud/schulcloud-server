import {
	DeleteObjectCommand,
	GetObjectCommand,
	ListObjectsCommand,
	PutObjectCommand,
	PutObjectCommandOutput,
	S3Client,
} from '@aws-sdk/client-s3';
import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { join } from 'path';
import { Readable } from 'stream';
import { S3Config } from '../interface/config';
import { IFile } from '../interface/file';
import { IStorageClient } from '../interface/storage-client';

@Injectable()
export class S3ClientAdapter implements IStorageClient {
	constructor(@Inject('S3_Client') readonly client: S3Client, @Inject('S3_Config') readonly config: S3Config) {}

	public async getFile(path: string) {
		try {
			const req = new GetObjectCommand({
				Bucket: this.config.bucket,
				Key: path,
			});
			const data = await this.client.send(req);

			return { data: data.Body as Readable, contentType: data.ContentType };
		} catch (error) {
			throw new NotFoundException('ENTITY_NOT_FOUND');
		}
	}

	public async deleteFolder(folder: string) {
		const data = await this.listFiles(folder);
		if (data.Contents) {
			return Promise.all(data.Contents.map((item) => this.deleteFile(item.Key || '')));
		}
		return false;
	}

	public async listFiles(folder: string) {
		const req = new ListObjectsCommand({
			Bucket: this.config.bucket,
			Prefix: folder,
		});
		const res = this.client.send(req);
		return res;
	}

	public async uploadFile(folder: string, file: IFile): Promise<PutObjectCommandOutput> {
		try {
			const req = new PutObjectCommand({
				Body: file.buffer,
				Bucket: this.config.bucket,
				Key: join(folder, file.fileName),
				ContentType: file.contentType,
			});
			const res = await this.client.send(req);

			return res;
		} catch (error) {
			throw new InternalServerErrorException(error);
		}
	}

	public async deleteFile(path: string) {
		const req = new DeleteObjectCommand({
			Bucket: this.config.bucket,
			Key: path,
		});
		return this.client.send(req);
	}
}
