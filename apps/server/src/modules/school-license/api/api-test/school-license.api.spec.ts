import { EntityManager } from '@mikro-orm/core';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { TestApiClient } from '@testing/test-api-client';
import { ServerTestModule } from '../../../server';
import { MediaSchoolLicenseUc } from '../../uc';
import { SchoolLicenseController } from '../school-license.controller';

describe('SchoolLicenseController (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [ServerTestModule],
			controllers: [SchoolLicenseController],
			providers: [
				{
					provide: MediaSchoolLicenseUc,
					useValue: {
						updateMediaSchoolLicenses: jest.fn(),
					},
				},
			],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'school-license');
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('POST /school-license/update', () => {
		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const response = await testApiClient.post('update', {});
				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when the feature is disabled', () => {
			const setup = async () => {
				config.FEATURE_SCHOOL_LICENSE_ENABLED = false;

				const currentUser: ICurrentUser = { userId: 'testUserId', schoolId: 'testSchoolId' };
				await em.persistAndFlush([currentUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(currentUser);

				return { loggedInClient };
			};

			it('should return a 403 error', async () => {
				const { loggedInClient } = await setup();
				const response = await loggedInClient.post('update', {});
				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the user is authenticated', () => {
			const setup = async () => {
				const currentUser: ICurrentUser = { userId: 'testUserId', schoolId: 'testSchoolId' };
				await em.persistAndFlush([currentUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(currentUser);

				return { loggedInClient, currentUser };
			};

			it('should call updateMediaSchoolLicenses with correct parameters', async () => {
				const { loggedInClient, currentUser } = await setup();

				const response = await loggedInClient.post('update', {});

				expect(response.status).toBe(HttpStatus.OK);
				expect(MediaSchoolLicenseUc.updateMediaSchoolLicenses).toHaveBeenCalledWith(
					currentUser.userId,
					currentUser.schoolId
				);
			});
		});
	});
});
