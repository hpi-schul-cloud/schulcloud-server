import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import S3rver from 's3rver';
import request from 'supertest';
import { s3Config } from '../../fwu-learning-contents.config';
import { FwuLearningContentsTestModule } from '../../fwu-learning-contents-test.module';
import { S3Config } from '../../interface/config';

class API {
	constructor(private app: INestApplication) {
		this.app = app;
	}

	async get(path: string) {
		return request(this.app.getHttpServer()).get(`/fwu/${path}`);
	}

	async getBytesRange(path: string, bytesRange: string) {
		return request(this.app.getHttpServer()).get(`/fwu/${path}`).set('Range', bytesRange);
	}
}

const createRndInt = (max) => Math.floor(Math.random() * max);
type UploadFile = { Key: string; Body: string | Buffer; ContentType: string };

/**
 * Creates a local S3 instance and uploads two example files
 */
async function setup(config: S3Config) {
	const client = new S3Client({
		region: config.region,
		credentials: {
			accessKeyId: config.accessKeyId,
			secretAccessKey: config.secretAccessKey,
		},
		endpoint: config.endpoint,
		forcePathStyle: true,
		tls: true,
	});

	const exampleTextFile = {
		Key: '12345/example.txt',
		Body: 'example-content',
		ContentType: 'text/plain',
	};

	const exampleBinaryFile = {
		Key: 'example',
		Body: Buffer.from([1, 2, 3, 4]),
		ContentType: 'application/octet-stream',
	};

	const upload = async (file: UploadFile) =>
		new Upload({
			client,
			params: {
				Bucket: config.bucket,
				...file,
			},
		}).done();

	await upload(exampleTextFile);
	await upload(exampleBinaryFile);

	return { exampleTextFile, exampleBinaryFile, client };
}
const port = 10000 + createRndInt(10000);
const overriddenS3Config = Object.assign(s3Config, { endpoint: `http://localhost:${port}` });
const s3instance = new S3rver({
	directory: `/tmp/s3rver_test_directory${port}`,
	resetOnClose: true,
	port,
	configureBuckets: [{ name: s3Config.bucket, configs: [] }],
});

describe('FwuLearningContents Controller (api)', () => {
	let app: INestApplication;
	let api: API;

	beforeAll(async () => {
		await s3instance.run();
		const module = await Test.createTestingModule({
			imports: [FwuLearningContentsTestModule],
			providers: [
				FwuLearningContentsTestModule,
				{
					provide: 'S3_Config',
					useValue: overriddenS3Config,
				},
			],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({
				canActivate() {
					return true;
				},
			})
			.compile();

		app = module.createNestApplication();
		await app.init();

		api = new API(app);
	});

	afterAll(async () => {
		await app.close();
		await s3instance.close();
	});

	describe('requestFwuContent', () => {
		Configuration.set('FEATURE_FWU_CONTENT_ENABLED', true);
		let exampleTextFile: UploadFile;
		describe('when the file has a file-extension', () => {
			it('should return 200 status', async () => {
				({ exampleTextFile } = await setup(overriddenS3Config));
				const response = await api.get(exampleTextFile.Key);
				expect(response.status).toEqual(200);
			});

			it('should return 206 status (bytesRange)', async () => {
				({ exampleTextFile } = await setup(overriddenS3Config));
				const response = await api.getBytesRange(exampleTextFile.Key, '12345');
				expect(response.status).toEqual(206);
			});

			it('should return file content', async () => {
				({ exampleTextFile } = await setup(overriddenS3Config));
				const response = await api.get(exampleTextFile.Key);
				expect(response.text).toEqual(exampleTextFile.Body);
			});

			it('should have the correct content-type', async () => {
				({ exampleTextFile } = await setup(overriddenS3Config));
				const response = await api.get(exampleTextFile.Key);
				expect(response.type).toEqual(exampleTextFile.ContentType);
			});
		});
		describe('when the file does not exist', () => {
			it('should return 404 error', async () => {
				({ exampleTextFile } = await setup(overriddenS3Config));
				const response = await api.get('1234/NotAValidKey.html');
				expect(response.status).toEqual(404);
			});
		});
		describe('when the feature is disabled', () => {
			it('should return InternalServerErrorException', async () => {
				({ exampleTextFile } = await setup(overriddenS3Config));
				Configuration.set('FEATURE_FWU_CONTENT_ENABLED', false);
				const response = await api.get(exampleTextFile.Key);
				expect(response.status).toEqual(500);
			});
		});
	});
});
