import { Injectable, NotFoundException, InternalServerErrorException, Inject } from '@nestjs/common';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Logger } from '@src/core/logger';
import { Configuration } from '@hpi-schul-cloud/commons';

@Injectable()
export class FwuLearningContentsUc {
	constructor(private logger: Logger, @Inject('S3_Client') readonly client: S3Client) {
		this.logger.setContext(FwuLearningContentsUc.name);
	}

	async get(path: string): Promise<Uint8Array> {
		console.log('UC FWU!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
		const request = new GetObjectCommand({
			Bucket: Configuration.get('FWU_CONTENT__S3_BUCKET') as string,
			Key: path.toString(),
		});
		const response = await this.client.send(request).catch((error) => {
			if ('name' in error) {
				if ((error as Error).name === 'NoSuchKey') {
					throw new NotFoundException();
				} else {
					throw new InternalServerErrorException((error as Error).name);
				}
			}
			throw new InternalServerErrorException();
		});
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
