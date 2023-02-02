import { EntityManager } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ICurrentUser, System } from '@shared/domain';
import { cleanupCollections, systemFactory } from '@shared/testing';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@src/modules/server';
import { Request } from 'express';
import request, { Response } from 'supertest';

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
		it('should redirect to the authentication url', async () => {
			const { system } = await setup();

			await request(app.getHttpServer())
				.get(`/sso/login/${system.id}`)
				.expect(307)
				.then((res: Response) => {
					expect(res.redirect).toEqual('');
					return res;
				});
		});
	});
});
