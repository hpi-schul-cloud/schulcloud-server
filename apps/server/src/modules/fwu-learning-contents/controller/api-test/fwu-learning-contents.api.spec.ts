import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { S3ClientAdapter } from '@infra/s3-client';
import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtAuthenticationFactory } from '@testing/factory/jwt-authentication.factory';
import { schoolEntityFactory } from '@testing/factory/school-entity.factory';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { Readable } from 'stream';
import { FwuLearningContentsTestModule } from '../../fwu-learning-contents-test.module';
import { FWU_CONTENT_S3_CONNECTION } from '../../fwu-learning-contents.config';

describe('FwuLearningContents Controller (api)', () => {
	let app: INestApplication;
	let s3ClientAdapter: DeepMocked<S3ClientAdapter>;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			imports: [FwuLearningContentsTestModule],
		})
			.overrideProvider(FWU_CONTENT_S3_CONNECTION)
			.useValue(createMock<S3ClientAdapter>())
			.compile();

		app = module.createNestApplication();
		await app.init();
		s3ClientAdapter = module.get(FWU_CONTENT_S3_CONNECTION);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('requestFwuContent', () => {
		Configuration.set('FEATURE_FWU_CONTENT_ENABLED', true);

		describe('when user is not authenticated', () => {
			const setup = () => {
				const apiClient = new TestApiClient(app, '/fwu');

				return { apiClient };
			};

			it('should return 401 status', async () => {
				const { apiClient } = setup();

				const response = await apiClient.get('12345/example.txt');

				expect(response.status).toEqual(401);
			});
		});

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

				const school = schoolEntityFactory.build();
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent({ school });
				const authValue = JwtAuthenticationFactory.createJwt({
					accountId: studentAccount.id,
					userId: studentUser.id,
					schoolId: studentUser.school.id,
					roles: [studentUser.roles[0].id],
					support: false,
					isExternalUser: false,
				});
				const apiClient = new TestApiClient(app, '/fwu', authValue);

				return { path, fileResponse, text, apiClient };
			};

			it('should return 200 status', async () => {
				const { path, apiClient } = setup();

				const response = await apiClient.get(path);

				expect(response.status).toEqual(200);
			});

			it('should return 206 status (bytesRange)', async () => {
				const { path, apiClient } = setup();

				const response = await apiClient.get(path).set('Range', '12345');

				expect(response.status).toEqual(206);
			});

			it('should return file content', async () => {
				const { path, text, apiClient } = setup();

				const response = await apiClient.get(path);

				expect(response.text).toEqual(text);
			});

			it('should have the correct content-type', async () => {
				const { path, fileResponse, apiClient } = setup();

				const response = await apiClient.get(path);

				expect(response.type).toEqual(fileResponse.contentType);
			});
		});

		describe('when the file does not exist', () => {
			const setup = () => {
				const error = new NotFoundException('NoSuchKey');
				s3ClientAdapter.get.mockRejectedValueOnce(error);

				const school = schoolEntityFactory.build();
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent({ school });
				const authValue = JwtAuthenticationFactory.createJwt({
					accountId: studentAccount.id,
					userId: studentUser.id,
					schoolId: studentUser.school.id,
					roles: [studentUser.roles[0].id],
					support: false,
					isExternalUser: false,
				});
				const apiClient = new TestApiClient(app, '/fwu', authValue);

				return { apiClient };
			};

			it('should return 404 error', async () => {
				const { apiClient } = setup();

				const response = await apiClient.get('1234/NotAValidKey.html');

				expect(response.status).toEqual(404);
			});
		});

		describe('when the feature is disabled', () => {
			const setup = () => {
				const error = new NotFoundException('NoSuchKey');
				s3ClientAdapter.get.mockRejectedValueOnce(error);

				const school = schoolEntityFactory.build();
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent({ school });
				const authValue = JwtAuthenticationFactory.createJwt({
					accountId: studentAccount.id,
					userId: studentUser.id,
					schoolId: studentUser.school.id,
					roles: [studentUser.roles[0].id],
					support: false,
					isExternalUser: false,
				});
				const apiClient = new TestApiClient(app, '/fwu', authValue);

				return { apiClient };
			};

			it('should return InternalServerErrorException', async () => {
				const { apiClient } = setup();

				Configuration.set('FEATURE_FWU_CONTENT_ENABLED', false);

				const response = await apiClient.get('12345/example.txt');

				expect(response.status).toEqual(500);
			});
		});
	});
});
