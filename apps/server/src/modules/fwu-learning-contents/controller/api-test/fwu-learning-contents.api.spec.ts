import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import S3rver from 's3rver';
import request from 'supertest';
import { s3Config } from '../../fwu-learning-contents.config';
import { FwuLearningContentsModule } from '../../fwu-learning-contents.module';
import { S3Config } from '../../interface/config';

class API {
	constructor(private app: INestApplication) {
		this.app = app;
	}

	async get(path: string) {
		return request(this.app.getHttpServer()).get(`/fwu/${path}`);
	}
}

const createRndInt = (max) => Math.floor(Math.random() * max);

type UploadFile = { Key: string; Body: string | Buffer; ContentType: string };

/**
 * Creates a local S3 instance and uploads two example files
 */
async function createS3rver(config: S3Config, port: number) {
	const s3instance = new S3rver({
		directory: `/tmp/s3rver_test_directory${port}`,
		resetOnClose: true,
		port,
		configureBuckets: [{ name: s3Config.bucket, configs: [] }],
	});

	await s3instance.run();

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

	return { s3instance, exampleTextFile, exampleBinaryFile };
}

if (Configuration.get('FEATURE_FWU_CONTENT_ENABLED')) {
	describe('FwuLearningContents Controller (api)', () => {
		let app: INestApplication;

		let api: API;

		let s3instance: S3rver;
		let exampleTextFile: UploadFile;
		let exampleBinaryFile: UploadFile;

		beforeAll(async () => {
			const port = 10000 + createRndInt(10000);
			const overriddenS3Config = Object.assign(s3Config, { endpoint: `http://localhost:${port}` });
			({ s3instance, exampleTextFile, exampleBinaryFile } = await createS3rver(overriddenS3Config, port));

			const module = await Test.createTestingModule({
				imports: [FwuLearningContentsModule],
				providers: [
					FwuLearningContentsModule,
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
			describe('when the file has a file-extension', () => {
				it('should return 200 status', async () => {
					const response = await api.get(exampleTextFile.Key);
					expect(response.status).toEqual(200);
				});

				it('should return file content', async () => {
					const response = await api.get(exampleTextFile.Key);
					expect(response.text).toEqual(exampleTextFile.Body);
				});

				it('should have the correct content-type', async () => {
					const response = await api.get(exampleTextFile.Key);
					expect(response.type).toEqual(exampleTextFile.ContentType);
				});
			});
			/*
			describe('when the file has no file-extension', () => {
				it('should return 200 status', async () => {
					const response = await api.get(exampleBinaryFile.Key);
					expect(response.status).toEqual(200);
				});

				it('should return file content', async () => {
					const response = await api.get(exampleBinaryFile.Key);
					expect(response.body).toEqual(exampleBinaryFile.Body);
				});

				it('should have the correct content-type', async () => {
					const response = await api.get(exampleBinaryFile.Key);
					expect(response.type).toEqual(exampleBinaryFile.ContentType);
				});
			});
			*/
			describe('when the file does not exist', () => {
				it('should return 404 error', async () => {
					const response = await api.get('1234/NotAValidKey.html');
					expect(response.status).toEqual(404);
				});
			});
		});
	});
}
