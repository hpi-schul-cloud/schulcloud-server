import { vidisPageOfferFactory } from '@infra/sync/media-licenses/testing';
import { PageOfferDTO } from '@infra/vidis-client';
import { EntityManager } from '@mikro-orm/mongodb';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { cleanupCollections } from '@testing/cleanup-collections';

import { MediaSourceDataFormat } from '@modules/media-source';
import { mediaSourceEntityFactory } from '@modules/media-source/testing';
import { federalStateEntityFactory, schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

describe('SchoolLicenseController (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	let axiosMock: MockAdapter;

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);

		axiosMock = new MockAdapter(axios);

		testApiClient = new TestApiClient(app, 'school-licenses');
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('POST /school-licenses', () => {
		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const response = await testApiClient.post();

				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when update media school licenses was successful', () => {
			const setup = async () => {
				const federalState = federalStateEntityFactory.build();
				const school = schoolEntityFactory.buildWithId({
					officialSchoolNumber: '00100',
					federalState,
				});
				const mediaSource = mediaSourceEntityFactory.build({ format: MediaSourceDataFormat.VIDIS });

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({ school }, [
					Permission.MEDIA_SCHOOL_LICENSE_ADMIN,
				]);
				await em.persistAndFlush([adminUser, adminAccount, federalState, school, mediaSource]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				const pageOfferDTO = vidisPageOfferFactory.build();

				axiosMock.onGet(/\/offers\/activated\/by-school\/[^/]+$/).replyOnce<PageOfferDTO>(200, {
					...pageOfferDTO,
				});

				return { loggedInClient };
			};

			it('should return status created', async () => {
				const { loggedInClient } = await setup();

				await loggedInClient.post('').send().expect(HttpStatus.CREATED);
			});
		});

		describe('when official school number was not found', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId({});
				const mediaSource = mediaSourceEntityFactory.build({ format: MediaSourceDataFormat.VIDIS });

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({ school }, [
					Permission.MEDIA_SCHOOL_LICENSE_ADMIN,
				]);

				await em.persistAndFlush([adminUser, adminAccount, school, mediaSource]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				const pageOfferDTO = vidisPageOfferFactory.build();

				axiosMock.onGet(/\/offers\/activated\/by-school\/[^/]+$/).replyOnce<PageOfferDTO>(200, {
					...pageOfferDTO,
				});

				return { loggedInClient };
			};

			it('should return status not found', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.post('').send();

				expect(response.status).toBe(HttpStatus.NOT_FOUND);
			});
		});

		describe('when media source not found', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId({
					officialSchoolNumber: '00100',
				});

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({ school }, [
					Permission.MEDIA_SCHOOL_LICENSE_ADMIN,
				]);
				await em.persistAndFlush([adminUser, adminAccount, school]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				const pageOfferDTO = vidisPageOfferFactory.build();

				axiosMock.onGet(/\/offers\/activated\/by-school\/[^/]+$/).replyOnce<PageOfferDTO>(200, {
					...pageOfferDTO,
				});

				return { loggedInClient };
			};

			it('should return status not found', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.post('').send();

				expect(response.status).toBe(HttpStatus.NOT_FOUND);
			});
		});

		describe('when user has no permission', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId({ officialSchoolNumber: '00100' });
				const mediaSource = mediaSourceEntityFactory.build({ format: MediaSourceDataFormat.VIDIS });

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({ school });
				await em.persistAndFlush([adminUser, adminAccount, school, mediaSource]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				const pageOfferDTO = vidisPageOfferFactory.build();

				axiosMock.onGet(/\/offers\/activated\/by-school\/[^/]+$/).replyOnce<PageOfferDTO>(200, {
					...pageOfferDTO,
				});

				return { loggedInClient };
			};

			it('should return status unauthorized', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.post('').send();

				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});
	});
});
