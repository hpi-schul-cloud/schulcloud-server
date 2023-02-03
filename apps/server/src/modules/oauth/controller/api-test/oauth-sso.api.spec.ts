import { EntityManager } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId, ICurrentUser, System } from '@shared/domain';
import { cleanupCollections, systemFactory } from '@shared/testing';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@src/modules/server';
import { Request } from 'express';
import request, { Response } from 'supertest';
import { AuthorizationParams } from '../dto';

jest.setTimeout(100000); // TODO Remove
describe('OAuth SSO Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let currentUser: ICurrentUser;

	beforeAll(async () => {
		const moduleRef: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({
				canActivate(context: ExecutionContext) {
					const req: Request = context.switchToHttp().getRequest();
					req.user = currentUser;
					return true;
				},
			})
			.compile();

		app = moduleRef.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
	});

	afterAll(async () => {
		await cleanupCollections(em);
		await app.close();
	});

	const setup = async () => {
		const system: System = systemFactory.withOauthConfig().buildWithId();

		await em.persistAndFlush(system);
		em.clear();

		return {
			system,
		};
	};

	describe('[GET] sso/login/:systemId', () => {
		it('should redirect to the authentication url and set a session cookie', async () => {
			const { system } = await setup();

			await request(app.getHttpServer())
				.get(`/sso/login/${system.id}`)
				.expect(302)
				.expect('set-cookie', /connect.sid/)
				.expect(
					'Location',
					/^http:\/\/mock.de\/auth\?client_id=12345&redirect_uri=http%3A%2F%2Fmockhost%3A3030%2Fapi%2Fv3%2Fsso%2Foauth%2FtestsystemId&response_type=code&scope=openid\+uuid&state=\w*/
				);
		});
	});

	describe('[GET] sso/oauth/:systemId', () => {
		const setupSessionState = async (systemId: EntityId) => {
			const response: Response = await request(app.getHttpServer())
				.get(`/sso/login/${systemId}`)
				.expect(302)
				.expect('set-cookie', /connect.sid/);

			const cookies: string[] = response.get('Set-Cookie');
			const redirect: string = response.get('Location');
			const matchState: RegExpMatchArray | null = redirect.match(/(?<=state=)([^&]+)/);
			const state = matchState ? matchState[0] : '';

			return {
				cookies,
				state,
			};
		};

		describe('when the session has no oauthLoginState', () => {
			it('should return 401 Unauthorized', async () => {
				const { system } = await setup();
				const query: AuthorizationParams = new AuthorizationParams();
				query.code = 'code';
				query.state = 'state';

				await request(app.getHttpServer()).get(`/sso/oauth/${system.id}`).query(query).expect(401);
			});
		});

		describe('when the session and the request have a different state', () => {
			it('should return 401 Unauthorized', async () => {
				const { system } = await setup();
				const query: AuthorizationParams = new AuthorizationParams();
				query.code = 'code';
				query.state = 'wrongState';

				await request(app.getHttpServer()).get(`/sso/login/${system.id}`).expect(302);
				await request(app.getHttpServer()).get(`/sso/oauth/${system.id}`).query(query).expect(401);
			});
		});

		describe('when code and state are valid', () => {
			it('should set a jwt and redirect', async () => {
				const { system } = await setup();
				const { state, cookies } = await setupSessionState(system.id);
				const query: AuthorizationParams = new AuthorizationParams();
				query.code = 'code';
				query.state = state;

				await request(app.getHttpServer())
					.get(`/sso/oauth/${system.id}`)
					.set('Cookie', cookies)
					.query(query)
					.expect(302)
					.expect('Location', 'http://localhost:3100/dashboard'); // TODO correct url
			});
		});

		describe('when code and state are valid', () => {
			it('should set a jwt and redirect', async () => {
				const { system } = await setup();
				const { state, cookies } = await setupSessionState(system.id);
				const query: AuthorizationParams = new AuthorizationParams();
				query.code = 'code';
				query.state = state;

				await request(app.getHttpServer())
					.get(`/sso/oauth/${system.id}`)
					.set('Cookie', cookies)
					.query(query)
					.expect(302)
					.expect('Location', 'http://localhost:3100/login?error=123&provider=mock_type'); // TODO correct url
			});
		});
	});
});
