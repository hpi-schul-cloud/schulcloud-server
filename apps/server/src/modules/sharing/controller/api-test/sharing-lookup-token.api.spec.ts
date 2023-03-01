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
import { ServerTestModule } from '@src/modules/server';
import { ShareTokenService } from '../../service';
import { ShareTokenInfoResponse, ShareTokenResponse, ShareTokenUrlParams } from '../dto';
import { ShareTokenContext, ShareTokenContextType, ShareTokenParentType } from '../../domainobject/share-token.do';

const baseRouteName = '/sharetoken';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async get(urlParams: ShareTokenUrlParams) {
		const response = await request(this.app.getHttpServer())
			.get(`${baseRouteName}/${urlParams.token}`)
			.set('Accept', 'application/json');

		return {
			result: response.body as ShareTokenResponse,
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}
}

describe(`share token lookup (api)`, () => {
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
			parentType: ShareTokenParentType.Course,
			parentName: course.getMetadata().title,
			token: shareToken.token,
		};
	};

	describe('with the feature disabled', () => {
		it('should return status 500', async () => {
			Configuration.set('FEATURE_COURSE_SHARE_NEW', false);
			const { token } = await setup();

			const response = await api.get({ token });

			expect(response.status).toEqual(500);
		});
	});

	describe('with a valid token', () => {
		it('should return status 200', async () => {
			const { token } = await setup();
			const response = await api.get({ token });

			expect(response.status).toEqual(200);
		});

		it('should return a valid result', async () => {
			const { parentType, parentName, token } = await setup();
			const response = await api.get({ token });

			const expectedResult: ShareTokenInfoResponse = {
				token,
				parentType,
				parentName,
			};

			expect(response.result).toEqual(expectedResult);
		});
	});

	describe('with invalid token', () => {
		it('should return status 404', async () => {
			await setup();
			const response = await api.get({ token: 'invalid_token' });
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
			const response = await api.get({ token });
			expect(response.status).toEqual(403);
		});
	});
});
