import { Injectable } from '@nestjs/common';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Logger } from '@src/core/logger';
import { s3Client, s3Bucket } from '../fwu.config';

@Injectable()
export class FwuUc {
	constructor(private logger: Logger) {
		this.logger.setContext(FwuUc.name);
	}

	async get(path: string): Promise<Uint8Array> {
		const client = s3Client;
		const request = new GetObjectCommand({
			Bucket: s3Bucket,
			Key: path.toString(),
		});
		const response = await client.send(request);
		if (response.$metadata.httpStatusCode !== 200) {
			this.logger.warn({
				message: 'S3 request failed for FWU content',
				url: path,
				error: response.$metadata.httpStatusCode,
			});
			return Promise.reject(response.$metadata.httpStatusCode);
		}
		const readableStream = response.Body as NodeJS.ReadableStream;
		return new Promise<Uint8Array>((resolve, reject) => {
			const chunks = [new Uint8Array()];
			readableStream.on('data', (chunk: Uint8Array) => chunks.push(chunk));
			readableStream.on('error', reject);
			readableStream.on('end', () => resolve(Buffer.concat(chunks)));
		});
	}
}
