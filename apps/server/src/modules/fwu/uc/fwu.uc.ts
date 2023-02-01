import { Injectable } from '@nestjs/common';
import { DeleteObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { FeathersAuthorizationService } from '@src/modules/authorization/feathers-authorization.service';
import { Logger } from '@src/core/logger';

@Injectable()
export class FwuUc {
    constructor(private authorizationService: FeathersAuthorizationService, private logger: Logger) {
        this.logger.setContext(FwuUc.name);
    }

    async get(courseId: number, path: String): Promise<String> {
        this.logger.log(`get ${courseId}/${path}`);
        // const client = new S3Client({
        //     endpoint: 'endpoint123',
        //     credentials: {
        //         accessKeyId: 'accesskey123',
        //         secretAccessKey: 'secretaccesskey123'
        //     },
        //     region: 'region',
        //     tls: true,
        //     forcePathStyle: true
        // });
        // const request = new GetObjectCommand({
        //     Bucket: 'fwu-content',
        //     Key: `${courseId}/${path}`
        // })
        // const response = await client.send(request);
        // return (response.Body as Blob).text();
        return '<html><body><h1>test123</h1></body></html>';
    }
}
