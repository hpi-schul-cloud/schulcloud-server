import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server/server.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardExternalReferenceType } from '@shared/domain/domainobject';
import { ColumnBoardNode } from '@shared/domain/entity';
import { TestApiClient, UserAndAccountTestFactory, cleanupCollections, courseFactory } from '@shared/testing';

const baseRouteName = '/boards';

describe(`create board (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, baseRouteName);
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	describe('When request is valid', () => {
		describe('When user is teacher and has course permission', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

				const course = courseFactory.build({ teachers: [teacherUser] });
				await em.persistAndFlush([teacherUser, course, teacherAccount]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, course };
			};

			it('should return status 204 and board', async () => {
				const { loggedInClient, course } = await setup();
				const title = 'new board';

				const response = await loggedInClient.post(undefined, {
					title,
					parentId: course.id,
					parentType: BoardExternalReferenceType.Course,
				});

				const boardId = (response.body as { id: string }).id;
				expect(response.status).toEqual(201);
				expect(boardId).toBeDefined();

				const dbResult = await em.findOneOrFail(ColumnBoardNode, boardId);
				expect(dbResult.title).toEqual(title);
			});
		});

		describe('When user is teacher and has no course permission', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

				const course = courseFactory.build();
				await em.persistAndFlush([teacherUser, course, teacherAccount]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, course };
			};

			it('should return status 204 and board', async () => {
				const { loggedInClient, course } = await setup();
				const title = 'new board';

				const response = await loggedInClient.post(undefined, {
					title,
					parentId: course.id,
					parentType: BoardExternalReferenceType.Course,
				});

				expect(response.status).toEqual(403);
			});
		});

		describe('When user is student and has course permission', () => {
			const setup = async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const course = courseFactory.build({ students: [studentUser] });
				await em.persistAndFlush([studentUser, course, studentAccount]);
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient, course };
			};

			it('should return status 204 and board', async () => {
				const { loggedInClient, course } = await setup();
				const title = 'new board';

				const response = await loggedInClient.post(undefined, {
					title,
					parentId: course.id,
					parentType: BoardExternalReferenceType.Course,
				});

				expect(response.status).toEqual(403);
			});
		});
	});

	describe('When request is invalid', () => {
		describe('When title is empty', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

				const course = courseFactory.build({ teachers: [teacherUser] });
				await em.persistAndFlush([teacherUser, course, teacherAccount]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, course };
			};

			it('should return status 400', async () => {
				const { loggedInClient, course } = await setup();
				const title = '';

				const response = await loggedInClient.post(undefined, {
					title,
					parentId: course.id,
					parentType: BoardExternalReferenceType.Course,
				});

				expect(response.status).toEqual(400);
			});
		});

		describe('When title is too long', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

				const course = courseFactory.build({ teachers: [teacherUser] });
				await em.persistAndFlush([teacherUser, course, teacherAccount]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, course };
			};

			it('should return status 400', async () => {
				const { loggedInClient, course } = await setup();
				const title = 'a'.repeat(101);

				const response = await loggedInClient.post(undefined, {
					title,
					parentId: course.id,
					parentType: BoardExternalReferenceType.Course,
				});

				expect(response.status).toEqual(400);
			});
		});

		describe('When course does not exist', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

				await em.persistAndFlush([teacherUser, teacherAccount]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient };
			};

			it('should return status 400', async () => {
				const { loggedInClient } = await setup();
				const title = 'new board';

				const response = await loggedInClient.post(undefined, {
					title,
					parentId: '123',
					parentType: BoardExternalReferenceType.Course,
				});

				expect(response.status).toEqual(400);
			});
		});

		describe('When parent type is invalid', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

				const course = courseFactory.build({ teachers: [teacherUser] });
				await em.persistAndFlush([teacherUser, course, teacherAccount]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, course };
			};

			it('should return status 400', async () => {
				const { loggedInClient, course } = await setup();
				const title = 'new board';

				const response = await loggedInClient.post(undefined, {
					title,
					parentId: course.id,
					parentType: 'invalid',
				});

				expect(response.status).toEqual(400);
			});
		});
	});
});
