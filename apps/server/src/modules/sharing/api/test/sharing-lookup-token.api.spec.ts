import { EntityManager } from '@mikro-orm/mongodb';
import { courseEntityFactory } from '@modules/course/testing';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { ShareTokenContextType, ShareTokenParentType } from '../../domainobject/share-token.do';
import { ShareTokenService } from '../../service';
import { SHARING_PUBLIC_API_CONFIG_TOKEN, SharingPublicApiConfig } from '../../sharing.config';
import { ShareTokenInfoResponse } from '../dto';

describe(`share token lookup (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;
	let shareTokenService: ShareTokenService;
	let testApiClient: TestApiClient;
	let config: SharingPublicApiConfig;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		shareTokenService = module.get(ShareTokenService);

		testApiClient = new TestApiClient(app, 'sharetoken');
		config = module.get<SharingPublicApiConfig>(SHARING_PUBLIC_API_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('with the feature disabled', () => {
		const setup = async () => {
			config.featureCourseShare = false;

			const parentType = ShareTokenParentType.Course;
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({}, [Permission.COURSE_CREATE]);
			const course = courseEntityFactory.build({ teachers: [teacherUser] });

			await em.persist([course, teacherAccount, teacherUser]).flush();
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

		it('should return status 403', async () => {
			const { token, loggedInClient } = await setup();

			const response = await loggedInClient.get(token);

			expect(response.status).toEqual(HttpStatus.FORBIDDEN);
		});
	});

	// test and setup for other feature flags are missed

	describe('with a valid token', () => {
		const setup = async () => {
			config.featureCourseShare = true;

			const parentType = ShareTokenParentType.Course;
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({}, [Permission.COURSE_CREATE]);
			const course = courseEntityFactory.build({ teachers: [teacherUser] });

			await em.persist([course, teacherAccount, teacherUser]).flush();
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
			config.featureCourseShare = true;

			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({}, [Permission.COURSE_CREATE]);
			const course = courseEntityFactory.build({ teachers: [teacherUser] });

			await em.persist([course, teacherAccount, teacherUser]).flush();
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
				message: 'The requested ShareToken has not been found.',
				title: 'Not Found',
				type: 'NOT_FOUND',
			});
		});
	});

	describe('with invalid context', () => {
		const setup = async () => {
			config.featureCourseShare = true;

			const parentType = ShareTokenParentType.Course;
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({}, [Permission.COURSE_CREATE]);
			const otherSchool = schoolEntityFactory.build();
			const course = courseEntityFactory.build({ teachers: [teacherUser] });

			await em.persist([course, teacherAccount, teacherUser, otherSchool]).flush();
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
