import { Injectable, NotFoundException, InternalServerErrorException, Inject, StreamableFile } from '@nestjs/common';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { Logger } from '@src/core/logger';
import { S3Config } from '../interface/config';

@Injectable()
export class FwuLearningContentsUc {
	constructor(
		private logger: Logger,
		@Inject('S3_Client') readonly client: S3Client,
		@Inject('S3_Config') readonly config: S3Config
	) {
		this.logger.setContext(FwuLearningContentsUc.name);
	}

	async get(path: string) {
		const request = new GetObjectCommand({
			Bucket: this.config.bucket,
			Key: path.toString(),
		});
		const data = await this.client.send(request).catch((error: unknown) => {
			if (error && typeof error === 'object' && 'name' in error) {
				if (error.name === 'NoSuchKey') {
					throw new NotFoundException();
				} else {
					throw new InternalServerErrorException(error.name);
				}
			}

			throw new InternalServerErrorException();
		});
		const stream = data.Body as Readable;

		return {
			data: stream,
			contentType: data.ContentType,
			contentLength: data.ContentLength,
			contentRange: data.ContentRange,
			etag: data.ETag,
		};

		/*
		const readableStream = response.Body as NodeJS.ReadableStream;
		return new Promise<Uint8Array>((resolve, reject) => {
			const chunks = [new Uint8Array()];
			readableStream.on('data', (chunk: Uint8Array) => chunks.push(chunk));
			readableStream.on('error', reject);
			readableStream.on('end', () => resolve(Buffer.concat(chunks)));
		});
		*/
	}
}
