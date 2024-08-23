import { SchulconnexResponse, schulconnexResponseFactory } from '@infra/schulconnex-client';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { OauthTokenResponse } from '@modules/oauth/service/dto';
import { serverConfig, ServerConfig } from '@modules/server';
import { ServerTestModule } from '@modules/server/server.module';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission, RoleName } from '@shared/domain/interface';
import { SchoolFeature } from '@shared/domain/types';
import {
	roleFactory,
	schoolEntityFactory,
	systemEntityFactory,
	TestApiClient,
	userFactory,
	userLoginMigrationFactory,
} from '@shared/testing';
import { accountFactory } from '@src/modules/account/testing';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

describe('ImportUser Controller Populate (API)', () => {
	let app: INestApplication;
	let em: EntityManager;

	let testApiClient: TestApiClient;
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
		const config: ServerConfig = serverConfig();
		config.FEATURE_USER_MIGRATION_ENABLED = true;
		config.FEATURE_USER_MIGRATION_SYSTEM_ID = systemId || new ObjectId().toString();
		config.FEATURE_MIGRATION_WIZARD_WITH_USER_LOGIN_MIGRATION = false;
	};

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();

		await app.init();

		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'user/import');
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
				const { account } = await authenticatedUser([Permission.IMPORT_USER_MIGRATE]);
				const loggedInClient = await testApiClient.login(account);

				const config: ServerConfig = serverConfig();
				config.FEATURE_USER_MIGRATION_ENABLED = false;

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
				const { account, school, system } = await authenticatedUser([Permission.IMPORT_USER_MIGRATE], [], false);
				school.externalId = undefined;

				const config: ServerConfig = serverConfig();
				config.FEATURE_USER_MIGRATION_SYSTEM_ID = system.id;

				const userLoginMigration = userLoginMigrationFactory.buildWithId({ school });
				await em.persistAndFlush([userLoginMigration]);

				const loggedInClient = await testApiClient.login(account);

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
				const { account, school, system } = await authenticatedUser([Permission.IMPORT_USER_MIGRATE]);
				const loggedInClient = await testApiClient.login(account);

				const config: ServerConfig = serverConfig();
				config.FEATURE_USER_MIGRATION_ENABLED = true;
				config.FEATURE_USER_MIGRATION_SYSTEM_ID = system.id;

				const userLoginMigration = userLoginMigrationFactory.buildWithId({ school });
				await em.persistAndFlush([userLoginMigration]);

				axiosMock.onPost(/(.*)\/token/).reply<OauthTokenResponse>(HttpStatus.OK, {
					id_token: 'idToken',
					refresh_token: 'refreshToken',
					access_token: 'accessToken',
				});

				const schulconnexResponse: SchulconnexResponse = schulconnexResponseFactory.build();
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
