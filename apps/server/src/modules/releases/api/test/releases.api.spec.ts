import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server';
import { HttpService } from '@nestjs/axios';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { of, throwError } from 'rxjs';
import { type GithubRelease } from '../../domain';
import { ReleaseEntity, ReleaseImageEntity } from '../../entity';
import { type ReleaseListResponse } from '../dto';

describe('Releases Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	let httpService: DeepMocked<HttpService>;

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [ServerTestModule],
		})
			.overrideProvider(HttpService)
			.useValue(createMock<HttpService>())
			.compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		httpService = app.get(HttpService);
		testApiClient = new TestApiClient(app, 'releases');
	});

	beforeEach(async () => {
		await em.nativeDelete(ReleaseEntity, {});
		await em.nativeDelete(ReleaseImageEntity, {});
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await app.close();
	});

	describe('GET /releases', () => {
		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const response = await testApiClient.get();
				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when the user is authenticated', () => {
			const setup = async () => {
				const releases = [
					new ReleaseEntity({
						name: 'Release 1',
						body: 'Description for release 1',
						url: 'https://example.com/releases/tag/release-1',
						author: 'JohnDoe',
						authorUrl: 'https://example.com/JohnDoe',
						createdAt: new Date('2024-01-01T00:00:00Z'),
						publishedAt: new Date('2024-01-02T00:00:00Z'),
						zipUrl: 'https://example.com/zipball/1',
					}),
					new ReleaseEntity({
						name: 'Release 2',
						body: 'Description for release 2',
						url: 'https://example.com/releases/tag/release-2',
						author: 'JohnDoe',
						authorUrl: 'https://example.com/JohnDoe',
						createdAt: new Date('2024-02-02T00:00:00Z'),
						publishedAt: new Date('2024-02-02T00:00:00Z'),
						zipUrl: 'https://example.com/zipball/2',
					}),
				];

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
				await em.persist([...releases, studentAccount, studentUser]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient, user: studentUser, account: studentAccount };
			};

			it('should return a list of releases sorted by publishedAt desc', async () => {
				const { loggedInClient } = await setup();
				const response = await loggedInClient.get();
				const body = response.body as ReleaseListResponse;

				expect(response.status).toBe(HttpStatus.OK);
				expect(body.data).toHaveLength(2);
				expect(body.data[0].name).toBe('Release 2');
			});

			describe('authorization', () => {
				it('should return a 403 error if the user does not have the required permission', async () => {
					const { loggedInClient, user } = await setup();
					await em.nativeUpdate('roles', { _id: user.roles[0]._id }, { $pull: { permissions: 'RELEASES_VIEW' } });

					const response = await loggedInClient.get();
					expect(response.status).toBe(HttpStatus.FORBIDDEN);
				});
			});

			describe('limit query parameter', () => {
				it('should limit the number of releases returned', async () => {
					const { loggedInClient } = await setup();
					const response = await loggedInClient.get().query({ limit: 1 });
					const body = response.body as ReleaseListResponse;

					expect(response.status).toBe(HttpStatus.OK);
					expect(body.data).toHaveLength(1);
					expect(body).toMatchObject({ total: 2, skip: 0, limit: 1 });
				});

				it('should respond with validation error if limit is zero', async () => {
					const { loggedInClient } = await setup();
					const response = await loggedInClient.get().query({ limit: 0 });
					expect(response.status).toBe(HttpStatus.BAD_REQUEST);
				});
			});

			describe('skip query parameter', () => {
				it('should skip the specified number of releases', async () => {
					const { loggedInClient } = await setup();
					const response = await loggedInClient.get().query({ skip: 1 });
					expect(response.status).toBe(HttpStatus.OK);
					expect((response.body as ReleaseListResponse).data).toHaveLength(1);
				});

				it('should respond with validation error if skip is negative', async () => {
					const { loggedInClient } = await setup();
					const response = await loggedInClient.get().query({ skip: -1 });
					expect(response.status).toBe(HttpStatus.BAD_REQUEST);
				});
			});
		});
	});

	describe('GET /releases/fetch', () => {
		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const response = await testApiClient.get('fetch');
				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when the user lacks RELEASES_CREATE', () => {
			it('should return a 403 error', async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
				await em.persist([studentAccount, studentUser]).flush();
				em.clear();
				const loggedInClient = await testApiClient.login(studentAccount);

				const response = await loggedInClient.get('fetch');
				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the user has RELEASES_CREATE', () => {
			const githubRelease = (id: number, body: string): GithubRelease => {
				return {
					id,
					name: `Release ${id}`,
					body,
					html_url: `https://github.com/test/RELEASE-NOTES/releases/${id}`,
					author: { login: 'JohnDoe', html_url: 'https://github.com/JohnDoe' },
					created_at: '2024-01-01T00:00:00Z',
					published_at: `2024-0${id}-02T00:00:00Z`,
				};
			};

			const setupUser = async () => {
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin();
				await em.persist([adminAccount, adminUser]).flush();
				await em.nativeUpdate(
					'roles',
					{ _id: adminUser.roles[0]._id },
					{ $addToSet: { permissions: { $each: ['RELEASES_CREATE', 'RELEASES_VIEW'] } } }
				);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return { loggedInClient };
			};

			describe('when the remote fetch succeeds', () => {
				const setup = async () => {
					const { loggedInClient } = await setupUser();

					const oldRelease = new ReleaseEntity({
						name: 'Old release',
						url: 'https://example.com/old',
						author: 'JohnDoe',
						authorUrl: 'https://example.com/JohnDoe',
						publishedAt: new Date('2023-01-01T00:00:00Z'),
					});
					const imageUrl = 'https://github.com/user-attachments/assets/new-image';
					const unusedImage = new ReleaseImageEntity({
						data: Buffer.from([9]),
						mimeType: 'image/png',
						sourceUrl: 'https://github.com/user-attachments/assets/unused',
					});
					await em.persist([oldRelease, unusedImage]).flush();
					em.clear();

					httpService.get
						.mockReturnValueOnce(
							of(
								axiosResponseFactory.build({
									data: [githubRelease(1, 'no images'), githubRelease(2, `<img src="${imageUrl}">`)],
								})
							)
						)
						.mockReturnValueOnce(
							of(axiosResponseFactory.build({ data: Buffer.from([1, 2, 3]), headers: { 'content-type': 'image/png' } }))
						);

					return { loggedInClient, imageUrl, unusedImage };
				};

				it('should respond with an empty body', async () => {
					const { loggedInClient } = await setup();

					const response = await loggedInClient.get('fetch');

					expect(response.status).toBe(HttpStatus.OK);
					expect(response.body).toEqual({});
				});

				it('should replace the old releases with the fetched ones', async () => {
					const { loggedInClient } = await setup();

					await loggedInClient.get('fetch');

					const releases = await em.find(ReleaseEntity, {}, { orderBy: { publishedAt: 'asc' } });
					expect(releases.map((release) => release.name)).toEqual(['Release 1', 'Release 2']);
				});

				it('should store the image, link it in the body and remove unreferenced images', async () => {
					const { loggedInClient, imageUrl, unusedImage } = await setup();

					await loggedInClient.get('fetch');

					const images = await em.find(ReleaseImageEntity, {});
					expect(images).toHaveLength(1);
					expect(images[0].sourceUrl).toBe(imageUrl);
					expect(images[0].id).not.toBe(unusedImage.id);

					const releaseWithImage = await em.findOneOrFail(ReleaseEntity, { name: 'Release 2' });
					expect(releaseWithImage.body).toBe(`<img src="/api/v3/releases/images/${images[0].id}">`);
				});
			});

			describe('when the remote fetch fails', () => {
				const setup = async () => {
					const { loggedInClient } = await setupUser();

					const existingRelease = new ReleaseEntity({
						name: 'Existing release',
						url: 'https://example.com/existing',
						author: 'JohnDoe',
						authorUrl: 'https://example.com/JohnDoe',
						publishedAt: new Date('2023-01-01T00:00:00Z'),
					});
					await em.persist(existingRelease).flush();
					em.clear();

					httpService.get.mockReturnValueOnce(throwError(() => new Error('GitHub unavailable')));

					return { loggedInClient };
				};

				it('should respond with an error and keep the existing releases', async () => {
					const { loggedInClient } = await setup();

					const response = await loggedInClient.get('fetch');

					expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
					const releases = await em.find(ReleaseEntity, {});
					expect(releases.map((release) => release.name)).toEqual(['Existing release']);
				});
			});
		});
	});

	describe('GET /releases/images/:imageId', () => {
		const setup = async () => {
			const imageData = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01, 0x02, 0x03]);
			const image = new ReleaseImageEntity({
				data: imageData,
				mimeType: 'image/png',
				sourceUrl: 'https://example.com/image.png',
			});

			const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
			await em.persist([image, studentAccount, studentUser]).flush();
			em.clear();

			const loggedInClient = await testApiClient.login(studentAccount);

			return { loggedInClient, image, imageData, user: studentUser };
		};

		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const { image } = await setup();

				const response = await testApiClient.get(`images/${image.id}`);

				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when the image exists', () => {
			it('should return the binary image with content type and cache headers', async () => {
				const { loggedInClient, image, imageData } = await setup();

				const response = await loggedInClient.get(`images/${image.id}`);

				expect(response.status).toBe(HttpStatus.OK);
				expect(response.headers['content-type']).toBe('image/png');
				expect(response.headers['cache-control']).toBe('private, max-age=31536000, immutable');
				expect(Buffer.compare(response.body as Buffer, imageData)).toBe(0);
			});
		});

		describe('when the user lacks RELEASES_VIEW', () => {
			it('should return a 403 error', async () => {
				const { loggedInClient, image, user } = await setup();
				await em.nativeUpdate('roles', { _id: user.roles[0]._id }, { $pull: { permissions: 'RELEASES_VIEW' } });

				const response = await loggedInClient.get(`images/${image.id}`);

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the image does not exist', () => {
			it('should return a 404 error', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get('images/6ae071cb9b5047324f3c97b7');

				expect(response.status).toBe(HttpStatus.NOT_FOUND);
			});
		});

		describe('when the image id is invalid', () => {
			it('should return a 400 error', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get('images/not-a-mongo-id');

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			});
		});
	});
});
