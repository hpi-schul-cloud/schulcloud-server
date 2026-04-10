import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { Release } from '../../domain';
import { ReleaseListResponse } from '../dto';

describe('Release Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'releases');
	});

	beforeEach(async () => {
		// Clear the releases collection before each test
		await em.getCollection('releases').deleteMany({});
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
				// Insert test data
				await em.getCollection<Release>('releases').insertMany([
					{
						// @ts-expect-error - MongoDB allows string _id values despite TypeScript types
						_id: '268233054',
						name: 'Release 1',
						body: 'Description for release 1',
						url: 'https://example.com/releases/tag/release-1',
						author: 'JohnDoe',
						authorUrl: 'https://example.com/JohnDoe',
						createdAt: new Date('2024-01-01T00:00:00Z'),
						publishedAt: new Date('2024-01-02T00:00:00Z'),
						zipUrl: 'https://example.com/zipball/268233054',
					},
					{
						// @ts-expect-error - MongoDB allows string _id values despite TypeScript types
						_id: '249412456',
						name: 'Release 2',
						body: 'Description for release 2',
						url: 'https://example.com/releases/tag/release-2',
						author: 'JohnDoe',
						authorUrl: 'https://example.com/JohnDoe',
						createdAt: new Date('2024-02-02T00:00:00Z'),
						publishedAt: new Date('2024-02-02T00:00:00Z'),
						zipUrl: 'https://example.com/zipball/249412456',
					},
				]);

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
				await em.persist([studentAccount, studentUser]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient, user: studentUser, account: studentAccount };
			};

			it('should return a list of releases', async () => {
				const { loggedInClient } = await setup();
				const response = await loggedInClient.get();
				expect(response.status).toBe(HttpStatus.OK);
				expect((response.body as ReleaseListResponse).data).toHaveLength(2);
			});

			describe('authorization', () => {
				it('should return a 403 error if the user does not have the required permission', async () => {
					const { loggedInClient, user } = await setup();
					// Revoke the RELEASES_VIEW permission from the user
					await em.nativeUpdate('roles', { _id: user.roles[0]._id }, { $pull: { permissions: 'RELEASES_VIEW' } });

					const response = await loggedInClient.get();
					expect(response.status).toBe(HttpStatus.FORBIDDEN);
				});
			});

			describe('limit query parameter', () => {
				it('should limit the number of releases returned', async () => {
					const { loggedInClient } = await setup();
					const response = await loggedInClient.get().query({ limit: 1 });
					expect(response.status).toBe(HttpStatus.OK);
					expect((response.body as ReleaseListResponse).data).toHaveLength(1);
				});

				it('should return all releases if limit is greater than total', async () => {
					const { loggedInClient } = await setup();
					const response = await loggedInClient.get().query({ limit: 10 });
					expect(response.status).toBe(HttpStatus.OK);
					expect((response.body as ReleaseListResponse).data).toHaveLength(2);
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

				it('should return all releases if skip is zero', async () => {
					const { loggedInClient } = await setup();
					const response = await loggedInClient.get().query({ skip: 0 });
					expect(response.status).toBe(HttpStatus.OK);
					expect((response.body as ReleaseListResponse).data).toHaveLength(2);
				});

				it('should respond with validation error if skip is negative', async () => {
					const { loggedInClient } = await setup();
					const response = await loggedInClient.get().query({ skip: -1 });
					expect(response.status).toBe(HttpStatus.BAD_REQUEST);
				});
			});
		});
	});
});
