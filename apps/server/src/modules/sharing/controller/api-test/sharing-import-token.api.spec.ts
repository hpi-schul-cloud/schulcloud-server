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
import { CopyApiResponse, CopyElementType, CopyStatusEnum } from '@src/modules/copy-helper';
import { ServerTestModule } from '@src/modules/server';
import { Request } from 'express';
import request from 'supertest';
import { ShareTokenContext, ShareTokenContextType, ShareTokenParentType } from '../../domainobject/share-token.do';
import { ShareTokenService } from '../../service';
import { ShareTokenImportBodyParams, ShareTokenResponse, ShareTokenUrlParams } from '../dto';

const baseRouteName = '/sharetoken';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async post(urlParams: ShareTokenUrlParams, body: ShareTokenImportBodyParams) {
		const response = await request(this.app.getHttpServer())
			.post(`${baseRouteName}/${urlParams.token}/import`)
			.set('Accept', 'application/json')
			.set('Authorization', 'jwt')
			.send(body);

		return {
			result: response.body as ShareTokenResponse,
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}
}

describe(`share token import (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;
	let currentUser: ICurrentUser;
	let shareTokenService: ShareTokenService;
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
		shareTokenService = module.get(ShareTokenService);

		api = new API(app);
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(() => {
		Configuration.set('FEATURE_COURSE_SHARE_NEW', true);
	});

	const setup = async (context?: ShareTokenContext) => {
		await cleanupCollections(em);
		const school = schoolFactory.build();
		const roles = roleFactory.buildList(1, {
			permissions: [Permission.COURSE_CREATE],
		});
		const user = userFactory.build({ school, roles });
		const course = courseFactory.build({ teachers: [user] });
		await em.persistAndFlush([user, course]);

		const shareToken = await shareTokenService.createToken(
			{
				parentType: ShareTokenParentType.Course,
				parentId: course.id,
			},
			{ context }
		);

		em.clear();

		currentUser = mapUserToCurrentUser(user);

		return {
			token: shareToken.token,
			elementType: CopyElementType.COURSE,
		};
	};

	describe('with the feature disabled', () => {
		it('should return status 500', async () => {
			Configuration.set('FEATURE_COURSE_SHARE_NEW', false);
			const { token } = await setup();

			const response = await api.post({ token }, { newName: 'NewName' });

			expect(response.status).toEqual(500);
		});
	});

	describe('with a valid token', () => {
		it('should return status 201', async () => {
			const { token } = await setup();
			const response = await api.post({ token }, { newName: 'NewName' });

			expect(response.status).toEqual(201);
		});

		it('should return a valid result', async () => {
			const { token, elementType } = await setup();
			const newName = 'NewName';
			const response = await api.post({ token }, { newName });

			const expectedResult: CopyApiResponse = {
				id: expect.any(String),
				type: elementType,
				title: newName,
				status: CopyStatusEnum.SUCCESS,
			};

			expect(response.result).toEqual(expect.objectContaining(expectedResult));
		});
	});

	describe('with invalid token', () => {
		it('should return status 404', async () => {
			await setup();
			const response = await api.post({ token: 'invalid_token' }, { newName: 'NewName' });
			expect(response.status).toEqual(404);
		});
	});

	describe('with invalid context', () => {
		it('should return status 403', async () => {
			const otherSchool = schoolFactory.build();
			await em.persistAndFlush(otherSchool);
			em.clear();

			const { token } = await setup({
				contextType: ShareTokenContextType.School,
				contextId: otherSchool.id,
			});
			const response = await api.post({ token }, { newName: 'NewName' });
			expect(response.status).toEqual(403);
		});
	});

	describe('with invalid new name', () => {
		it('should return status 501', async () => {
			const { token } = await setup();
			// @ts-expect-error invalid new name
			const response = await api.post({ token }, { newName: 42 });

			expect(response.status).toEqual(501);
		});
	});
});
