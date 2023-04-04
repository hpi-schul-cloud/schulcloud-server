import { EntityManager } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OauthConfig, System } from '@shared/domain';
import { cleanupCollections, systemFactory } from '@shared/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@src/modules/server';
import { Request } from 'express';
import request, { Response } from 'supertest';
import { PublicSystemListResponse } from '../dto/public-system-list.response';
import { PublicSystemResponse } from '../dto/public-system-response';

describe('System (API)', () => {
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
		await app.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('[GET] systems/public', () => {
		describe('when the endpoint is called', () => {
			const setup = async () => {
				const system1: System = systemFactory.buildWithId();
				const system2: System = systemFactory.withOauthConfig().buildWithId();
				const system2OauthConfig: OauthConfig = system2.oauthConfig as OauthConfig;

				await em.persistAndFlush([system1, system2]);
				em.clear();

				return { system1, system2, system2OauthConfig };
			};

			it('should return a list of all systems', async () => {
				const { system1, system2, system2OauthConfig } = await setup();

				const response: Response = await request(app.getHttpServer()).get(`/systems/public`).expect(200);

				expect(response.body).toEqual<PublicSystemListResponse>({
					data: [
						{
							id: system1.id,
							type: system1.type,
							alias: system1.alias,
							displayName: system1.displayName,
						},
						{
							id: system2.id,
							type: system2.type,
							alias: system2.alias,
							displayName: system2.displayName,
							oauthConfig: {
								clientId: system2OauthConfig.clientId,
								idpHint: system2OauthConfig.idpHint,
								issuer: system2OauthConfig.issuer,
								authEndpoint: system2OauthConfig.authEndpoint,
								grantType: system2OauthConfig.grantType,
								jwksEndpoint: system2OauthConfig.jwksEndpoint,
								provider: system2OauthConfig.provider,
								logoutEndpoint: system2OauthConfig.logoutEndpoint,
								responseType: system2OauthConfig.responseType,
								tokenEndpoint: system2OauthConfig.tokenEndpoint,
								redirectUri: system2OauthConfig.redirectUri,
								scope: system2OauthConfig.scope,
							},
						},
					],
				});
			});
		});
	});

	describe('[GET] systems/public/:systemId', () => {
		describe('when the endpoint is called with a known systemId', () => {
			const setup = async () => {
				const system1: System = systemFactory.buildWithId();
				const system2: System = systemFactory.buildWithId();

				await em.persistAndFlush([system1, system2]);
				em.clear();

				return { system1, system2 };
			};

			it('should return the system', async () => {
				const { system1 } = await setup();

				const response: Response = await request(app.getHttpServer()).get(`/systems/public/${system1.id}`).expect(200);

				expect(response.body).toEqual<PublicSystemResponse>({
					id: system1.id,
					type: system1.type,
					alias: system1.alias,
					displayName: system1.displayName,
				});
			});
		});
	});
});
