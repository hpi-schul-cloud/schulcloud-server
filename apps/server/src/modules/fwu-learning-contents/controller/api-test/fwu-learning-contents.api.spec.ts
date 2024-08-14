import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { JwtAuthGuard } from '@infra/auth-guard';
import { S3ClientAdapter } from '@infra/s3-client';
import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Readable } from 'stream';
import request from 'supertest';
import { FwuLearningContentsTestModule } from '../../fwu-learning-contents-test.module';
import { FWU_CONTENT_S3_CONNECTION } from '../../fwu-learning-contents.config';

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

describe('FwuLearningContents Controller (api)', () => {
	let app: INestApplication;
	let api: API;
	let s3ClientAdapter: DeepMocked<S3ClientAdapter>;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			imports: [FwuLearningContentsTestModule],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({
				canActivate() {
					return true;
				},
			})
			.overrideProvider(FWU_CONTENT_S3_CONNECTION)
			.useValue(createMock<S3ClientAdapter>())
			.compile();

		app = module.createNestApplication();
		await app.init();
		s3ClientAdapter = module.get(FWU_CONTENT_S3_CONNECTION);

		api = new API(app);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('requestFwuContent', () => {
		Configuration.set('FEATURE_FWU_CONTENT_ENABLED', true);
		describe('when the file has a file-extension', () => {
			const setup = () => {
				const path = '12345/example.txt';
				const text = 'testText';
				const readable = Readable.from(text);

				const fileResponse = {
					data: readable,
					contentType: 'text/plain',
					contentLength: text.length,
					contentRange: '1',
					etag: 'testTag',
				};

				s3ClientAdapter.get.mockResolvedValueOnce(fileResponse);

				return { path, fileResponse, text };
			};

			it('should return 200 status', async () => {
				const { path } = setup();

				const response = await api.get(path);
				expect(response.status).toEqual(200);
			});

			it('should return 206 status (bytesRange)', async () => {
				const { path } = setup();

				const response = await api.getBytesRange(path, '12345');
				expect(response.status).toEqual(206);
			});

			it('should return file content', async () => {
				const { path, text } = setup();

				const response = await api.get(path);

				expect(response.text).toEqual(text);
			});

			it('should have the correct content-type', async () => {
				const { path, fileResponse } = setup();

				const response = await api.get(path);

				expect(response.type).toEqual(fileResponse.contentType);
			});
		});
		describe('when the file does not exist', () => {
			const setup = () => {
				const error = new NotFoundException('NoSuchKey');
				s3ClientAdapter.get.mockRejectedValueOnce(error);
			};

			it('should return 404 error', async () => {
				setup();

				const response = await api.get('1234/NotAValidKey.html');

				expect(response.status).toEqual(404);
			});
		});

		describe('when the feature is disabled', () => {
			it('should return InternalServerErrorException', async () => {
				Configuration.set('FEATURE_FWU_CONTENT_ENABLED', false);

				const response = await api.get('12345/example.txt');

				expect(response.status).toEqual(500);
			});
		});
	});
});
