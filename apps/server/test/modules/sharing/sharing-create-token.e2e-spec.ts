import { EntityManager } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { ICurrentUser, Permission, ShareTokenParentType } from '@shared/domain';
import {
	cleanupCollections,
	courseFactory,
	mapUserToCurrentUser,
	roleFactory,
	schoolFactory,
	userFactory,
} from '@shared/testing';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ShareTokenBodyParams, ShareTokenResponse } from '@src/modules/sharing/controller/dto';
import { ServerTestModule } from '@src/server.module';
import { Request } from 'express';
import request from 'supertest';

const baseRouteName = '/sharetoken';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async post(body: ShareTokenBodyParams) {
		const response = await request(this.app.getHttpServer())
			.post(`${baseRouteName}`)
			.set('Accept', 'application/json')
			.send(body);

		return {
			result: response.body as ShareTokenResponse,
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}
}

describe(`${baseRouteName} (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;
	let currentUser: ICurrentUser;
	let api: API;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
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

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		api = new API(app);
	});

	afterAll(async () => {
		await app.close();
	});

	const setup = async () => {
		await cleanupCollections(em);
		const school = schoolFactory.build();
		const roles = roleFactory.buildList(1, {
			permissions: [Permission.COURSE_CREATE],
		});
		const user = userFactory.build({ school, roles });
		const course = courseFactory.build({ teachers: [user] });

		await em.persistAndFlush([user, course]);
		em.clear();

		currentUser = mapUserToCurrentUser(user);

		return { course };
	};

	describe('with ivalid request data', () => {
		it('should return status 401 on empty parent id', async () => {
			const response = await api.post({
				parentId: '',
				parentType: ShareTokenParentType.Course,
			});

			expect(response.status).toEqual(401);
		});

		it('should return status 401 when parent id is not found', async () => {
			const response = await api.post({
				parentId: '000011112222333344445555',
				parentType: ShareTokenParentType.Course,
			});

			expect(response.status).toEqual(401);
		});

		it('should return status 401 on invalid parent id', async () => {
			const response = await api.post({
				parentId: 'foobar',
				parentType: ShareTokenParentType.Course,
			});

			expect(response.status).toEqual(401);
		});

		it('should return status 400 on invalid parent type', async () => {
			const { course } = await setup();

			const response = await api.post({
				parentId: course.id,
				// @ts-expect-error test
				parentType: 'invalid',
			});

			expect(response.status).toEqual(400);
		});

		it('should return status 400 when expiresInDays is invalid integer', async () => {
			const { course } = await setup();

			const response = await api.post({
				parentId: course.id,
				parentType: ShareTokenParentType.Course,
				// @ts-expect-error test
				expiresInDays: 'foo',
			});

			expect(response.status).toEqual(400);
		});

		it('should return status 400 when expiresInDays is negative', async () => {
			const { course } = await setup();

			const response = await api.post({
				parentId: course.id,
				parentType: ShareTokenParentType.Course,
				expiresInDays: -10,
			});

			expect(response.status).toEqual(400);
		});

		it('should return status 400 when expiresInDays is not an integer', async () => {
			const { course } = await setup();

			const response = await api.post({
				parentId: course.id,
				parentType: ShareTokenParentType.Course,
				expiresInDays: 2.5,
			});

			expect(response.status).toEqual(400);
		});
	});

	describe('with valid course payload', () => {
		it('should return status 201', async () => {
			const { course } = await setup();

			const response = await api.post({ parentId: course.id, parentType: ShareTokenParentType.Course });

			expect(response.status).toEqual(201);
		});

		it('should return a valid result', async () => {
			const { course } = await setup();

			const response = await api.post({ parentId: course.id, parentType: ShareTokenParentType.Course });

			expect(response.result).toEqual({
				token: expect.any(String) as string,
				payload: {
					parentId: course.id,
					parentType: ShareTokenParentType.Course,
				},
			});
		});

		describe('when exclusive to school', () => {
			it('should return status 201', async () => {
				const { course } = await setup();

				const response = await api.post({
					parentId: course.id,
					parentType: ShareTokenParentType.Course,
					schoolExclusive: true,
				});

				expect(response.status).toEqual(201);
			});

			it('should return a valid result', async () => {
				const { course } = await setup();

				const response = await api.post({
					parentId: course.id,
					parentType: ShareTokenParentType.Course,
					schoolExclusive: true,
				});

				expect(response.result).toEqual({
					token: expect.any(String) as string,
					payload: {
						parentId: course.id,
						parentType: ShareTokenParentType.Course,
					},
				});
			});
		});

		describe('with expiration duration', () => {
			it('should return status 201', async () => {
				const { course } = await setup();

				const response = await api.post({
					parentId: course.id,
					parentType: ShareTokenParentType.Course,
					expiresInDays: 5,
				});

				expect(response.status).toEqual(201);
			});

			it('should return a valid result containg the expiration timestamp', async () => {
				const { course } = await setup();

				const response = await api.post({
					parentId: course.id,
					parentType: ShareTokenParentType.Course,
					expiresInDays: 5,
				});

				expect(response.result).toEqual({
					token: expect.any(String) as string,
					expiresAt: expect.any(String) as string,
					payload: {
						parentId: course.id,
						parentType: ShareTokenParentType.Course,
					},
				});
			});
		});
	});
});
