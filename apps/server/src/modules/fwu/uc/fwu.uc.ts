import { Injectable } from '@nestjs/common';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Logger } from '@src/core/logger';
import { Configuration } from '@hpi-schul-cloud/commons';

@Injectable()
export class FwuUc {
	constructor(private logger: Logger) {
		this.logger.setContext(FwuUc.name);
	}

	async get(path: string): Promise<Uint8Array> {
		const client = new S3Client({
			endpoint: Configuration.get('FWU_CONTENT__S3_ENDPOINT') as string,
			credentials: {
				accessKeyId: Configuration.get('FWU_CONTENT__S3_ACCESS_KEY') as string,
				secretAccessKey: Configuration.get('FWU_CONTENT__S3_SECRET_KEY') as string,
			},
			region: Configuration.get('FWU_CONTENT__S3_REGION') as string,
			tls: true,
			forcePathStyle: true,
		});
		const request = new GetObjectCommand({
			Bucket: Configuration.get('FWU_CONTENT__S3_BUCKET') as string,
			Key: path.toString(),
		});
		const response = await client.send(request);
		if (response.$metadata.httpStatusCode !== 200) {
			// eslint-disable-next-line no-console
			console.log(`S3 request failed for: ${path}`);
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
