import { Request } from 'express';
import request from 'supertest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { EntityManager } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { Permission } from '@shared/domain';
import { ICurrentUser } from '@src/modules/authentication';
import {
	cleanupCollections,
	courseFactory,
	mapUserToCurrentUser,
	roleFactory,
	schoolFactory,
	userFactory,
} from '@shared/testing';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@src/modules/server/server.module';
import { ShareTokenBodyParams, ShareTokenResponse } from '../dto';
import { ShareTokenParentType } from '../../domainobject/share-token.do';

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

describe(`share token creation (api)`, () => {
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

	beforeEach(() => {
		Configuration.set('FEATURE_COURSE_SHARE_NEW', true);
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

	describe('with the feature disabled', () => {
		it('should return status 500', async () => {
			Configuration.set('FEATURE_COURSE_SHARE_NEW', false);
			const { course } = await setup();

			const response = await api.post({ parentId: course.id, parentType: ShareTokenParentType.Course });

			expect(response.status).toEqual(500);
		});
	});

	describe('with ivalid request data', () => {
		it('should return status 400 on empty parent id', async () => {
			const response = await api.post({
				parentId: '',
				parentType: ShareTokenParentType.Course,
			});

			expect(response.status).toEqual(400);
		});

		it('should return status 403 when parent id is not found', async () => {
			const response = await api.post({
				parentId: '000011112222333344445555',
				parentType: ShareTokenParentType.Course,
			});

			expect(response.status).toEqual(403);
		});

		it('should return status 400 on invalid parent id', async () => {
			const response = await api.post({
				parentId: 'foobar',
				parentType: ShareTokenParentType.Course,
			});

			expect(response.status).toEqual(400);
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
				token: expect.any(String),
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
					token: expect.any(String),
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
					token: expect.any(String),
					expiresAt: expect.any(String),
					payload: {
						parentId: course.id,
						parentType: ShareTokenParentType.Course,
					},
				});
			});
		});
	});
});
