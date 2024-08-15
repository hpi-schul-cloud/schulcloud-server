import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ICurrentUser, JwtAuthGuard } from '@infra/auth-guard';
import { EntityManager } from '@mikro-orm/mongodb';
import { CopyApiResponse, CopyElementType, CopyStatusEnum } from '@modules/copy-helper';
import { ServerTestModule } from '@modules/server';
import { ExecutionContext, HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { Permission } from '@shared/domain/interface';
import {
	cleanupCollections,
	courseFactory,
	mapUserToCurrentUser,
	roleFactory,
	schoolEntityFactory,
	userFactory,
} from '@shared/testing';
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
		Configuration.set('FEATURE_COURSE_SHARE', true);
	});

	const setup = async (context?: ShareTokenContext) => {
		await cleanupCollections(em);
		const school = schoolEntityFactory.build();
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
			Configuration.set('FEATURE_COURSE_SHARE', false);
			const { token } = await setup();

			const response = await api.post({ token }, { newName: 'NewName' });

			expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
		});
	});

	describe('with a valid token', () => {
		it('should return status 201', async () => {
			const { token } = await setup();

			const response = await api.post({ token }, { newName: 'NewName' });

			expect(response.status).toEqual(HttpStatus.CREATED);
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

			expect(response.status).toEqual(HttpStatus.NOT_FOUND);
		});
	});

	describe('with invalid context', () => {
		const setup2 = async () => {
			const school = schoolEntityFactory.build();
			const otherSchool = schoolEntityFactory.build();
			const roles = roleFactory.buildList(1, {
				permissions: [Permission.COURSE_CREATE],
			});

			const user = userFactory.build({ school, roles });
			const course = courseFactory.build({ teachers: [user] });
			await em.persistAndFlush([user, course, otherSchool]);

			const context = {
				contextType: ShareTokenContextType.School,
				contextId: otherSchool.id,
			};

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
				shareTokenFromDifferentCourse: shareToken.token,
			};
		};

		it('should return status 403', async () => {
			const { shareTokenFromDifferentCourse } = await setup2();

			const response = await api.post({ token: shareTokenFromDifferentCourse }, { newName: 'NewName' });

			expect(response.status).toEqual(HttpStatus.FORBIDDEN);
		});
	});

	describe('with invalid new name', () => {
		it('should return status 501', async () => {
			const { token } = await setup();
			// @ts-expect-error invalid new name
			const response = await api.post({ token }, { newName: 42 });

			expect(response.status).toEqual(HttpStatus.NOT_IMPLEMENTED);
		});
	});
});
