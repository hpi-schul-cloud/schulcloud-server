import { Injectable } from '@nestjs/common';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { FeathersAuthorizationService } from '@src/modules/authorization/feathers-authorization.service';
import { Logger } from '@src/core/logger';
import { Configuration } from '@hpi-schul-cloud/commons';
import { FwuRepo } from '../repo/fwu.repo';

@Injectable()
export class FwuUc {
	constructor(private authorizationService: FeathersAuthorizationService, private logger: Logger) {
		this.logger.setContext(FwuUc.name);
	}

	async get(path: string): Promise<Uint8Array> {
		const fwuRepo = new FwuRepo();
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
		const response = fwuRepo.getFwuConentFromS3(client, request, path);
		const readableStream = (await response).Body as NodeJS.ReadableStream;
		return new Promise<Uint8Array>((resolve, reject) => {
			const chunks = [new Uint8Array()];
			readableStream.on('data', (chunk: Uint8Array) => chunks.push(chunk));
			readableStream.on('error', reject);
			readableStream.on('end', () => resolve(Buffer.concat(chunks)));
		});

		// TODO: handle other types of responses such as Blob
	}
}
