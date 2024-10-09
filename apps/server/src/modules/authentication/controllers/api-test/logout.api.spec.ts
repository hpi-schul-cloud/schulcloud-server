import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server/server.module';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
	cleanupCollections,
	JwtTestFactory,
	schoolEntityFactory,
	systemEntityFactory,
	systemOauthConfigEntityFactory,
	TestApiClient,
	UserAndAccountTestFactory,
} from '@shared/testing';
import { Response } from 'supertest';

jest.mock('jwks-rsa', () => () => {
	return {
		getKeys: jest.fn(),
		getSigningKey: jest.fn().mockResolvedValue({
			kid: 'kid',
			alg: 'RS256',
			getPublicKey: jest.fn().mockReturnValue(JwtTestFactory.getPublicKey()),
			rsaPublicKey: JwtTestFactory.getPublicKey(),
		}),
		getSigningKeys: jest.fn(),
	};
});

describe('Logout Controller (api)', () => {
	const baseRouteName = '/logout';

	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, baseRouteName);
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('logoutOidc', () => {
		describe('when a valid logout token is provided', () => {
			const setup = async () => {
				const userExternalId = 'userExternalId';

				const oauthConfigEntity = systemOauthConfigEntityFactory.build();
				const system = systemEntityFactory.withOauthConfig(oauthConfigEntity).buildWithId();

				const school = schoolEntityFactory.buildWithId({ systems: [system] });
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({
					school,
					externalId: userExternalId,
					systemId: system.id,
				});

				await em.persistAndFlush([system, school, studentAccount, studentUser]);
				em.clear();

				const logoutToken = JwtTestFactory.createLogoutToken({
					sub: userExternalId,
					iss: oauthConfigEntity.issuer,
					aud: oauthConfigEntity.clientId,
				});

				return {
					system,
					logoutToken,
				};
			};

			it('should log out the user', async () => {
				const { logoutToken } = await setup();

				const response: Response = await testApiClient.post('/oidc', { logout_token: logoutToken });

				expect(response.status).toEqual(HttpStatus.OK);
			});
		});
	});
});
