import { SchulconnexResponse } from '@infra/schulconnex-client';
import { schulconnexResponseFactory } from '@infra/schulconnex-client/testing';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { accountFactory } from '@modules/account/testing';
import { OauthTokenResponse } from '@modules/oauth-adapter';
import { RoleName } from '@modules/role';
import { roleFactory } from '@modules/role/testing';
import { SchoolFeature } from '@modules/school/domain';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server/server.app.module';
import { systemEntityFactory } from '@modules/system/testing';
import { USER_IMPORT_CONFIG_TOKEN, UserImportConfig } from '@modules/user-import/user-import-config';
import { userLoginMigrationFactory } from '@modules/user-login-migration/testing';
import { userFactory } from '@modules/user/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { TestApiClient } from '@testing/test-api-client';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

describe('ImportUser Controller Populate (API)', () => {
	let app: INestApplication;
	let em: EntityManager;

	let testApiClient: TestApiClient;
	let axiosMock: MockAdapter;
	let userImportConfig: UserImportConfig;

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
		await em.persist([system, school, ...roles]).flush();
		const user = userFactory.buildWithId({ roles, school });
		const account = accountFactory.withUser(user).buildWithId();
		await em.persist([user, account]).flush();
		em.clear();
		return { user, account, roles, school, system };
	};

	const setConfig = (systemId?: string) => {
		userImportConfig.featureUserMigrationEnabled = true;
		userImportConfig.featureUserMigrationSystemId = systemId || new ObjectId().toString();
		userImportConfig.featureMigrationWizardWithUserLoginMigration = false;
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
		userImportConfig = app.get<UserImportConfig>(USER_IMPORT_CONFIG_TOKEN);
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

				userImportConfig.featureUserMigrationEnabled = false;

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

				userImportConfig.featureUserMigrationSystemId = system.id;

				const userLoginMigration = userLoginMigrationFactory.buildWithId({ school });
				await em.persist([userLoginMigration]).flush();

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

				userImportConfig.featureUserMigrationEnabled = true;
				userImportConfig.featureUserMigrationSystemId = system.id;

				const userLoginMigration = userLoginMigrationFactory.buildWithId({ school });
				await em.persist([userLoginMigration]).flush();

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
