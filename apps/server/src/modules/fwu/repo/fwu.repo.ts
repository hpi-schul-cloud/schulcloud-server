import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FwuRepo {
	async getFwuConentFromS3(client: S3Client, request: GetObjectCommand, path: string) {
		const response = await client.send(request);
		if (response.$metadata.httpStatusCode !== 200) {
			// eslint-disable-next-line no-console
			console.log(`S3 request failed for: ${path}`);
			return Promise.reject(response.$metadata.httpStatusCode);
		}
		return response;
	}
}
