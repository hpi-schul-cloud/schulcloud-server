import { SanisResponse, schulconnexResponseFactory } from '@infra/schulconnex-client';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { OauthTokenResponse } from '@modules/oauth/service/dto';
import { ServerTestModule } from '@modules/server/server.module';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission, RoleName } from '@shared/domain/interface';
import { SchoolFeature } from '@shared/domain/types';
import {
	TestApiClient,
	roleFactory,
	schoolEntityFactory,
	systemEntityFactory,
	userFactory,
} from '@shared/testing/factory';
import { accountFactory } from '@src/modules/account/testing';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { IUserImportFeatures, UserImportFeatures } from '../../config';

describe('ImportUser Controller Populate (API)', () => {
	let app: INestApplication;
	let em: EntityManager;

	let testApiClient: TestApiClient;
	let userImportFeatures: IUserImportFeatures;
	let axiosMock: MockAdapter;

	const authenticatedUser = async (
		permissions: Permission[] = [],
		features: SchoolFeature[] = [],
		schoolHasExternalId = true
	) => {
		const system = systemEntityFactory.buildWithId();
		const school = schoolEntityFactory.build({
			officialSchoolNumber: 'foo',
			features,
			systems: [system],
			externalId: schoolHasExternalId ? system.id : undefined,
		});
		const roles = [roleFactory.build({ name: RoleName.ADMINISTRATOR, permissions })];
		await em.persistAndFlush([system, school, ...roles]);
		const user = userFactory.buildWithId({ roles, school });
		const account = accountFactory.withUser(user).buildWithId();
		await em.persistAndFlush([user, account]);
		em.clear();
		return { user, account, roles, school, system };
	};

	const setConfig = (systemId?: string) => {
		userImportFeatures.userMigrationEnabled = true;
		userImportFeatures.userMigrationSystemId = systemId || new ObjectId().toString();
		userImportFeatures.useWithUserLoginMigration = false;
	};

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();

		await app.init();

		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'user/import');
		userImportFeatures = app.get(UserImportFeatures);
		axiosMock = new MockAdapter(axios);
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(() => {
		setConfig();
	});

	describe('[POST] user/import/populate-import-users', () => {
		describe('when user is not authenticated', () => {
			const setup = () => {
				const notLoggedInClient = new TestApiClient(app, 'user/import');

				return { notLoggedInClient };
			};

			it('should return unauthorized', async () => {
				const { notLoggedInClient } = setup();

				await notLoggedInClient.post('populate-import-users').send().expect(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when migration is not activated', () => {
			const setup = async () => {
				const { account } = await authenticatedUser([Permission.SCHOOL_IMPORT_USERS_MIGRATE]);
				const loggedInClient = await testApiClient.login(account);

				userImportFeatures.userMigrationEnabled = false;

				return { loggedInClient };
			};

			it('should return with status forbidden', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.post('populate-import-users').send();

				expect(response.body).toEqual({
					type: 'USER_MIGRATION_IS_NOT_ENABLED',
					title: 'User Migration Is Not Enabled',
					message: 'Feature flag of user migration may be disable or the school is not an LDAP pilot',
					code: HttpStatus.FORBIDDEN,
				});
			});
		});

		describe('when users school has no external id', () => {
			const setup = async () => {
				const { account, school, system } = await authenticatedUser(
					[Permission.SCHOOL_IMPORT_USERS_MIGRATE],
					[],
					false
				);
				const loggedInClient = await testApiClient.login(account);
				userImportFeatures.userMigrationSystemId = system.id;

				school.externalId = undefined;

				return { loggedInClient };
			};

			it('should return with status bad request', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.post('populate-import-users').send();

				expect(response.body).toEqual({
					type: 'USER_IMPORT_SCHOOL_EXTERNAL_ID_MISSING',
					title: 'User Import School External Id Missing',
					message: 'Bad Request',
					code: HttpStatus.BAD_REQUEST,
				});
			});
		});

		describe('when users were populated successful', () => {
			const setup = async () => {
				const { account, school, system } = await authenticatedUser([Permission.SCHOOL_IMPORT_USERS_MIGRATE]);
				const loggedInClient = await testApiClient.login(account);

				userImportFeatures.userMigrationEnabled = true;
				userImportFeatures.userMigrationSystemId = system.id;

				axiosMock.onPost(/(.*)\/token/).reply<OauthTokenResponse>(HttpStatus.OK, {
					id_token: 'idToken',
					refresh_token: 'refreshToken',
					access_token: 'accessToken',
				});

				const schulconnexResponse: SanisResponse = schulconnexResponseFactory.build();
				axiosMock.onGet(/(.*)\/personen-info/).reply(HttpStatus.OK, [schulconnexResponse]);

				return { loggedInClient, account, school };
			};

			it('should return with status created', async () => {
				const { loggedInClient } = await setup();

				await loggedInClient.post('populate-import-users').send().expect(HttpStatus.CREATED);
			});
		});
	});
});
