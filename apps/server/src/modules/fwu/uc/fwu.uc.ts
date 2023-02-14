import { Injectable } from '@nestjs/common';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { FeathersAuthorizationService } from '@src/modules/authorization/feathers-authorization.service';
import { Logger } from '@src/core/logger';
import { Configuration } from '@hpi-schul-cloud/commons';

@Injectable()
export class FwuUc {
    constructor(private authorizationService: FeathersAuthorizationService, private logger: Logger) {
        this.logger.setContext(FwuUc.name);
    }

    async get(path: String): Promise<Uint8Array> {
        const client = new S3Client({
            endpoint: Configuration.get('FWU_CONTENT__S3_ENDPOINT'),
            credentials: {
                accessKeyId: Configuration.get('FWU_CONTENT__S3_ACCESS_KEY'),
                secretAccessKey: Configuration.get('FWU_CONTENT__S3_SECRET_KEY')
            },
            region: Configuration.get('FWU_CONTENT__S3_REGION'),
            tls: true,
            forcePathStyle: true
        });
        const request = new GetObjectCommand({
            Bucket: Configuration.get('FWU_CONTENT__S3_BUCKET'),
            Key: path.toString()
        });
        const response = await client.send(request);
        if (response.$metadata.httpStatusCode !== 200) {
            console.log(`S3 request failed for: ${path}`);
            return Promise.reject(response.$metadata.httpStatusCode);
        }
        var readableStream = response.Body as NodeJS.ReadableStream;
        return new Promise<Uint8Array>(async (resolve, reject) => {
            const chunks = [new Uint8Array];
            readableStream.on('data', (chunk: Uint8Array) => chunks.push(chunk));
            readableStream.on('error', reject);
            readableStream.on('end', () => resolve(Buffer.concat(chunks)));
        })
        
        // TODO: handle other types of responses such as Blob
    }
}
