import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { EntityManager } from '@mikro-orm/mongodb';
import { CopyApiResponse, CopyElementType, CopyStatusEnum } from '@modules/copy-helper';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import {
	cleanupCollections,
	courseFactory,
	roleFactory,
	schoolEntityFactory,
	TestApiClient,
	UserAndAccountTestFactory,
	userFactory,
} from '@shared/testing';
import { ShareTokenContext, ShareTokenContextType, ShareTokenParentType } from '../../domainobject/share-token.do';
import { ShareTokenService } from '../../service';

describe(`Share Token Import (API)`, () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	let shareTokenService: ShareTokenService;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, 'sharetoken');
		shareTokenService = module.get(ShareTokenService);
	});

	beforeEach(async () => {
		await cleanupCollections(em);
		Configuration.set('FEATURE_COURSE_SHARE', true);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('POST /sharetoken/:token/import', () => {
		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const token = 'aaLnAEZ0xqIW';
				const response = await testApiClient.post(`${token}/import`, {
					newName: 'NewName',
				});
				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when the user is valid', () => {
			const setup = async (context?: ShareTokenContext) => {
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

				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				await em.persistAndFlush([teacherAccount, teacherUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return {
					loggedInClient,
					token: shareToken.token,
					elementType: CopyElementType.COURSE,
				};
			};

			describe('with the feature disabled', () => {
				beforeEach(() => {
					Configuration.set('FEATURE_COURSE_SHARE', false);
				});

				it('should return a 403 error', async () => {
					const { loggedInClient, token } = await setup();
					const response = await loggedInClient.post(`${token}/import`, {
						newName: 'NewName',
					});
					expect(response.status).toBe(HttpStatus.FORBIDDEN);
				});
			});

			describe('with a valid token', () => {
				it('should return status 201', async () => {
					const { loggedInClient, token } = await setup();

					const response = await loggedInClient.post(`${token}/import`, {
						newName: 'NewName',
					});

					expect(response.status).toEqual(HttpStatus.CREATED);
				});

				it('should return a valid result', async () => {
					const { loggedInClient, token, elementType } = await setup();
					const newName = 'NewName';
					const response = await loggedInClient.post(`${token}/import`, {
						newName,
					});
					const expectedResult: CopyApiResponse = {
						id: expect.any(String),
						type: elementType,
						title: newName,
						status: CopyStatusEnum.SUCCESS,
					};

					expect(response.body as CopyApiResponse).toEqual(expect.objectContaining(expectedResult));
				});
			});

			describe('with invalid token', () => {
				it('should return status 404', async () => {
					const { loggedInClient } = await setup();

					const response = await loggedInClient.post(`invalid_token/import`, {
						newName: 'NewName',
					});

					expect(response.status).toEqual(HttpStatus.NOT_FOUND);
				});
			});

			describe('with invalid context', () => {
				it('should return status 403', async () => {
					const otherSchool = schoolEntityFactory.build();
					await em.persistAndFlush(otherSchool);

					const { loggedInClient, token: tokenFromOtherSchool } = await setup({
						contextId: otherSchool.id,
						contextType: ShareTokenContextType.School,
					});

					const response = await loggedInClient.post(`${tokenFromOtherSchool}/import`, {
						newName: 'NewName',
					});

					expect(response.status).toEqual(HttpStatus.FORBIDDEN);
				});
			});

			describe('with invalid new name', () => {
				it('should return status 501', async () => {
					const { loggedInClient, token } = await setup();
					const response = await loggedInClient.post(`${token}/import`, {
						newName: 42,
					});
					expect(response.status).toEqual(HttpStatus.NOT_IMPLEMENTED);
				});
			});
		});
	});
});
