import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { ConfigurationModule } from '@infra/configuration';
import { type S3ClientAdapter } from '@infra/s3-client';
import { FWU_PUBLIC_API_CONFIG_TOKEN, type FwuPublicApiConfig } from '@modules/fwu-learning-contents';
import { type INestApplication, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClientBuilder } from '@testing/test-api-client-builder';
import { TEST_JWT_CONFIG_TOKEN, TestJwtModuleConfig } from '@testing/test-jwt-module.config';
import { Readable } from 'node:stream';
import { FwuLearningContentsTestModule } from '../../fwu-learning-contents-test.module';
import { FWU_S3_CLIENT_INJECTION_TOKEN } from '../../fwu.const';
import { type FwuItem } from '../../interface/fwu-item';
import { type FwuListResponse } from '../dto/fwu-list.response';

const baseRouteName = 'fwu';

jest.mock('../../fwu.filesIndex', () => {
	return {
		filesIndex: ['5521408'],
	};
});

describe('FwuLearningContents Controller (api)', () => {
	let app: INestApplication;
	let s3ClientAdapter: DeepMocked<S3ClientAdapter>;
	let jwtConfig: TestJwtModuleConfig;
	let fwuConfig: FwuPublicApiConfig;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			imports: [
				FwuLearningContentsTestModule,
				ConfigurationModule.register(TEST_JWT_CONFIG_TOKEN, TestJwtModuleConfig),
			],
		})
			.overrideProvider(FWU_S3_CLIENT_INJECTION_TOKEN)
			.useValue(createMock<S3ClientAdapter>())
			.compile();

		app = module.createNestApplication();
		await app.init();
		jwtConfig = module.get(TEST_JWT_CONFIG_TOKEN);
		s3ClientAdapter = module.get(FWU_S3_CLIENT_INJECTION_TOKEN);
		fwuConfig = module.get<FwuPublicApiConfig>(FWU_PUBLIC_API_CONFIG_TOKEN);

		fwuConfig.fwuContentEnabled = true;
	});

	afterAll(async () => {
		await app.close();
	});

	describe('requestFwuContent', () => {
		describe('when user is not authenticated', () => {
			it('should return 401 status', async () => {
				const response = await new TestApiClientBuilder(app, baseRouteName).build().get('12345/example.txt');

				expect(response.status).toEqual(401);
			});
		});

		describe('when the file has a file-extension', () => {
			const setup = async () => {
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

				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();
				const loggedInClient = await new TestApiClientBuilder(app, baseRouteName).withJwt(studentUser, jwtConfig).build(studentAccount);

				return { path, fileResponse, text, loggedInClient };
			};

			it('should return 200 status', async () => {
				const { path, loggedInClient } = await setup();

				const response = await loggedInClient.get(path);

				expect(response.status).toEqual(200);
			});

			it('should return 206 status (bytesRange)', async () => {
				const { path, loggedInClient } = await setup();

				const response = await loggedInClient.get(path).set('Range', '12345');

				expect(response.status).toEqual(206);
			});

			it('should return file content', async () => {
				const { path, text, loggedInClient } = await setup();

				const response = await loggedInClient.get(path);

				expect(response.text).toEqual(text);
			});

			it('should have the correct content-type', async () => {
				const { path, fileResponse, loggedInClient } = await setup();

				const response = await loggedInClient.get(path);

				expect(response.type).toEqual(fileResponse.contentType);
			});
		});

		describe('when the file does not exist', () => {
			const setup = async () => {
				const error = new NotFoundException('NoSuchKey');
				s3ClientAdapter.get.mockRejectedValueOnce(error);

				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();
				const loggedInClient = await new TestApiClientBuilder(app, baseRouteName).withJwt(studentUser, jwtConfig).build(studentAccount);

				return { loggedInClient };
			};

			it('should return 404 error', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get('1234/NotAValidKey.html');

				expect(response.status).toEqual(404);
			});
		});

		describe('when the feature is disabled', () => {
			const setup = async () => {
				const error = new NotFoundException('NoSuchKey');
				s3ClientAdapter.get.mockRejectedValueOnce(error);

				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();
				const loggedInClient = await new TestApiClientBuilder(app, baseRouteName).withJwt(studentUser, jwtConfig).build(studentAccount);
				fwuConfig.fwuContentEnabled = false;

				return { loggedInClient };
			};

			it('should return InternalServerErrorException', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get('12345/example.txt');

				expect(response.status).toEqual(500);
			});
		});
	});

	describe('getList', () => {
		describe('when user is not authenticated', () => {
			it('should return 401 status', async () => {
				const response = await new TestApiClientBuilder(app, baseRouteName).build().get('');

				expect(response.status).toEqual(401);
			});
		});

		describe('when feature is not enabled', () => {
			const setup = async () => {
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();
				const loggedInClient = await new TestApiClientBuilder(app, baseRouteName).withJwt(studentUser, jwtConfig).build(studentAccount);
				fwuConfig.fwuContentEnabled = false;

				return { loggedInClient };
			};

			it('should return 500 status', async () => {
				const { loggedInClient } = await setup();
				const response = await loggedInClient.get();

				expect(response.status).toEqual(500);
			});

			describe('when feature is enabled', () => {
				const mockS3GetResponse = (htmlContent: string) => {
					const stream = Readable.from(htmlContent);
					const response = {
						data: stream,
						contentType: 'text/html',
						contentLength: htmlContent.length,
					};
					s3ClientAdapter.get.mockResolvedValue(response);
				};

				const setup = async () => {
					const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();
					const loggedInClient = await new TestApiClientBuilder(app, baseRouteName).withJwt(studentUser, jwtConfig).build(studentAccount);
					fwuConfig.fwuContentEnabled = true;

					const htmlContent = `<html>
						<body>
							<div class="pname">Test Title</div>
							<div class="ptext">Test Description</div>
							<div class="player_outer" style="background-image: url(thumbnail.jpg);"></div>
						</body>
					</html>`;

					mockS3GetResponse(htmlContent);

					const expected: FwuItem = {
						id: '5521408',
						title: 'Test Title',
						targetUrl: '/api/v3/fwu/5521408/index.html',
						thumbnailUrl: '/api/v3/fwu/5521408/thumbnail.jpg',
					};

					return { loggedInClient, expected };
				};

				it('should return 200 status', async () => {
					const { loggedInClient } = await setup();

					const response = await loggedInClient.get();

					expect(response.status).toEqual(200);
				});

				it('should return a list with fwu', async () => {
					const { loggedInClient, expected } = await setup();

					const response = await loggedInClient.get();
					const responseBody = response.body as FwuListResponse;
					expect(responseBody.data[0]).toEqual(expected);
				});

				describe('thumbnailUrl parsing', () => {
					const setupWithPlayerTag = async (playerHtmlContent: string) => {
						const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();
						const loggedInClient = await new TestApiClientBuilder(app, baseRouteName).withJwt(studentUser, jwtConfig).build(studentAccount);

						const htmlContent = `<html>
						<body>
							<div class="pname">Test Title</div>
							<div class="ptext">Test Description</div>
							${playerHtmlContent}
						</body>
						</html>`;

						mockS3GetResponse(htmlContent);

						return { loggedInClient };
					};

					describe('when player tag is missing', () => {
						it('should return undefined thumbnailUrl', async () => {
							const { loggedInClient } = await setupWithPlayerTag('');

							const response = await loggedInClient.get();
							const responseBody = response.body as FwuListResponse;
							expect(responseBody.data[0].thumbnailUrl).toBeUndefined();
						});
					});

					describe('when style attribute is missing', () => {
						it('should return undefined thumbnailUrl', async () => {
							const { loggedInClient } = await setupWithPlayerTag('<div class="player_outer"></div>');

							const response = await loggedInClient.get();
							const responseBody = response.body as FwuListResponse;
							expect(responseBody.data[0].thumbnailUrl).toBeUndefined();
						});
					});

					describe('when style attribute has no url()', () => {
						it('should return undefined thumbnailUrl', async () => {
							const { loggedInClient } = await setupWithPlayerTag(
								'<div class="player_outer" style="background-color: red;"></div>'
							);

							const response = await loggedInClient.get();
							const responseBody = response.body as FwuListResponse;
							expect(responseBody.data[0].thumbnailUrl).toBeUndefined();
						});
					});

					describe('when style attribute has url()', () => {
						it('should return correct thumbnailUrl', async () => {
							const { loggedInClient } = await setupWithPlayerTag(
								'<div class="player_outer" style="background-image: url(\'thumb.png\');"></div>'
							);

							const response = await loggedInClient.get();
							const responseBody = response.body as FwuListResponse;
							expect(responseBody.data[0].thumbnailUrl).toEqual('/api/v3/fwu/5521408/thumb.png');
						});
					});

					describe('when url() has no quotes', () => {
						it('should return correct thumbnailUrl', async () => {
							const { loggedInClient } = await setupWithPlayerTag(
								'<div class="player_outer" style="background-image: url(thumb.png);"></div>'
							);

							const response = await loggedInClient.get();
							const responseBody = response.body as FwuListResponse;
							expect(responseBody.data[0].thumbnailUrl).toEqual('/api/v3/fwu/5521408/thumb.png');
						});
					});

					describe('when url() has double quotes', () => {
						it('should return correct thumbnailUrl', async () => {
							const { loggedInClient } = await setupWithPlayerTag(
								`<div class="player_outer" style='background-image: url("thumb.png");'></div>`
							);

							const response = await loggedInClient.get();
							const responseBody = response.body as FwuListResponse;
							expect(responseBody.data[0].thumbnailUrl).toEqual('/api/v3/fwu/5521408/thumb.png');
						});
					});
				});
			});
		});
	});
});
