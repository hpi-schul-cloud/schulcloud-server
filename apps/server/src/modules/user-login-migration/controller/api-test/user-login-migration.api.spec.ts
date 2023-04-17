import { ExecutionContext, INestApplication } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mongodb';
import MockAdapter from 'axios-mock-adapter';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import axios from 'axios';
import { cleanupCollections, schoolFactory, systemFactory, UserAndAccountTestFactory } from '@shared/testing';
import { School, System } from '@shared/domain';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@src/modules/server';
import { ICurrentUser } from '@src/modules/authentication';
import { JwtTestFactory } from '@shared/testing/factory/jwt.test.factory';

describe('OAuth SSO Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let currentUser: ICurrentUser;
	let axiosMock: MockAdapter;

	beforeAll(async () => {
		Configuration.set('PUBLIC_BACKEND_URL', 'http://localhost:3030/api');
		JwtTestFactory.mockJwksRsa();
		const userJwt = JwtTestFactory.createJwt();

		const moduleRef: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({
				canActivate(context: ExecutionContext) {
					const req: Request = context.switchToHttp().getRequest();
					req.user = currentUser;
					req.headers.authorization = userJwt;
					return true;
				},
			})
			.compile();

		axiosMock = new MockAdapter(axios);
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

	describe('[POST] user-login-migrations/migrate-to-oauth2', () => {
		const setup = async () => {
			const system: System = systemFactory.withOauthConfig().buildWithId();
			const school: School = schoolFactory.buildWithId({ systems: [system] });

			const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher({ school });

			await em.persistAndFlush([system, teacherUser, school, teacherAccount]);
			em.clear();
		};

		it('should migrate user', async () => {
			await setup();
		});
	});
});
