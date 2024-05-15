import { Configuration } from '@hpi-schul-cloud/commons';
import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { courseFactory, schoolEntityFactory, TestApiClient, UserAndAccountTestFactory } from '@shared/testing/factory';
import { ShareTokenContextType, ShareTokenParentType } from '../../domainobject/share-token.do';
import { ShareTokenService } from '../../service';
import { ShareTokenInfoResponse } from '../dto';

describe(`share token lookup (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;
	let shareTokenService: ShareTokenService;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		shareTokenService = module.get(ShareTokenService);

		testApiClient = new TestApiClient(app, 'sharetoken');
	});

	afterAll(async () => {
		await app.close();
	});

	describe('with the feature disabled', () => {
		const setup = async () => {
			Configuration.set('FEATURE_COURSE_SHARE', false);

			const parentType = ShareTokenParentType.Course;
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({}, [Permission.COURSE_CREATE]);
			const course = courseFactory.build({ teachers: [teacherUser] });

			await em.persistAndFlush([course, teacherAccount, teacherUser]);
			em.clear();

			const shareToken = await shareTokenService.createToken(
				{
					parentType,
					parentId: course.id,
				},
				undefined
			);

			const loggedInClient = await testApiClient.login(teacherAccount);

			return {
				token: shareToken.token,
				loggedInClient,
			};
		};

		it('should return status 500', async () => {
			const { token, loggedInClient } = await setup();

			const response = await loggedInClient.get(token);

			expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
			expect(response.body).toEqual({
				code: 500,
				message: 'Import Course Feature not enabled',
				title: 'Internal Server Error',
				type: 'INTERNAL_SERVER_ERROR',
			});
		});
	});

	// test and setup for other feature flags are missed

	describe('with a valid token', () => {
		const setup = async () => {
			Configuration.set('FEATURE_COURSE_SHARE', true);

			const parentType = ShareTokenParentType.Course;
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({}, [Permission.COURSE_CREATE]);
			const course = courseFactory.build({ teachers: [teacherUser] });

			await em.persistAndFlush([course, teacherAccount, teacherUser]);
			em.clear();

			const shareToken = await shareTokenService.createToken(
				{
					parentType,
					parentId: course.id,
				},
				undefined
			);

			const loggedInClient = await testApiClient.login(teacherAccount);

			const expectedResult: ShareTokenInfoResponse = {
				token: shareToken.token,
				parentType,
				parentName: course.getMetadata().title,
			};

			return {
				expectedResult,
				token: shareToken.token,
				loggedInClient,
			};
		};

		it('should return status 200 with correct formated body', async () => {
			const { token, loggedInClient, expectedResult } = await setup();

			const response = await loggedInClient.get(token);

			expect(response.status).toEqual(HttpStatus.OK);
			expect(response.body).toEqual(expectedResult);
		});
	});

	describe('with invalid token', () => {
		const setup = async () => {
			Configuration.set('FEATURE_COURSE_SHARE', true);

			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({}, [Permission.COURSE_CREATE]);
			const course = courseFactory.build({ teachers: [teacherUser] });

			await em.persistAndFlush([course, teacherAccount, teacherUser]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return {
				invalidToken: 'invalid_token',
				loggedInClient,
			};
		};

		it('should return status 404', async () => {
			const { invalidToken, loggedInClient } = await setup();

			const response = await loggedInClient.get(invalidToken);

			expect(response.status).toEqual(HttpStatus.NOT_FOUND);
			expect(response.body).toEqual({
				code: 404,
				message: 'The requested ShareToken: [object Object] has not been found.',
				title: 'Not Found',
				type: 'NOT_FOUND',
			});
		});
	});

	describe('with invalid context', () => {
		const setup = async () => {
			Configuration.set('FEATURE_COURSE_SHARE', true);

			const parentType = ShareTokenParentType.Course;
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({}, [Permission.COURSE_CREATE]);
			const otherSchool = schoolEntityFactory.build();
			const course = courseFactory.build({ teachers: [teacherUser] });

			await em.persistAndFlush([course, teacherAccount, teacherUser, otherSchool]);
			em.clear();

			const context = {
				contextType: ShareTokenContextType.School,
				contextId: otherSchool.id,
			};

			const shareToken = await shareTokenService.createToken(
				{
					parentType,
					parentId: course.id,
				},
				{ context }
			);

			const loggedInClient = await testApiClient.login(teacherAccount);

			const expectedResult: ShareTokenInfoResponse = {
				token: shareToken.token,
				parentType,
				parentName: course.getMetadata().title,
			};

			return {
				expectedResult,
				token: shareToken.token,
				loggedInClient,
			};
		};

		it('should return status 403', async () => {
			const { token, loggedInClient } = await setup();

			const response = await loggedInClient.get(token);

			expect(response.status).toEqual(HttpStatus.FORBIDDEN);
			expect(response.body).toEqual({
				code: 403,
				message: 'Forbidden',
				title: 'Forbidden',
				type: 'FORBIDDEN',
			});
		});
	});
});
