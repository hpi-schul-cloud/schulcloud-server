import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server/server.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardExternalReferenceType, BoardLayout } from '@shared/domain/domainobject';
import { ColumnBoardNode } from '@shared/domain/entity';
import { cleanupCollections, courseFactory, TestApiClient, UserAndAccountTestFactory } from '@shared/testing';
import { CreateBoardBodyParams } from '../dto';

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

			it('should return status 201 and board', async () => {
				const { loggedInClient, course } = await setup();
				const title = 'new board';

				const response = await loggedInClient.post(undefined, <CreateBoardBodyParams>{
					title,
					parentId: course.id,
					parentType: BoardExternalReferenceType.Course,
					layout: BoardLayout.COLUMNS,
				});

				const boardId = (response.body as { id: string }).id;
				expect(response.status).toEqual(201);
				expect(boardId).toBeDefined();

				const dbResult = await em.findOneOrFail(ColumnBoardNode, boardId);
				expect(dbResult.title).toEqual(title);
			});

			describe('Board layout', () => {
				describe(`When layout is set to "${BoardLayout.COLUMNS}"`, () => {
					it('should create a column board', async () => {
						const { loggedInClient, course } = await setup();

						const response = await loggedInClient.post(undefined, <CreateBoardBodyParams>{
							title: 'new board',
							parentId: course.id,
							parentType: BoardExternalReferenceType.Course,
							layout: BoardLayout.COLUMNS,
						});

						const boardId = (response.body as { id: string }).id;
						expect(response.status).toEqual(201);
						expect(boardId).toBeDefined();

						const dbResult = await em.findOneOrFail(ColumnBoardNode, boardId);
						expect(dbResult.layout).toEqual(BoardLayout.COLUMNS);
					});
				});

				describe(`When layout is set to "${BoardLayout.LIST}"`, () => {
					it('should create a list board', async () => {
						const { loggedInClient, course } = await setup();

						const response = await loggedInClient.post(undefined, <CreateBoardBodyParams>{
							title: 'new board',
							parentId: course.id,
							parentType: BoardExternalReferenceType.Course,
							layout: BoardLayout.LIST,
						});

						const boardId = (response.body as { id: string }).id;
						expect(response.status).toEqual(201);
						expect(boardId).toBeDefined();

						const dbResult = await em.findOneOrFail(ColumnBoardNode, boardId);
						expect(dbResult.layout).toEqual(BoardLayout.LIST);
					});
				});
			});

			describe('When layout is omitted', () => {
				it('should return status 400', async () => {
					const { loggedInClient, course } = await setup();

					const response = await loggedInClient.post(undefined, <Omit<CreateBoardBodyParams, 'layout'>>{
						title: 'new board',
						parentId: course.id,
						parentType: BoardExternalReferenceType.Course,
						layout: undefined,
					});

					expect(response.status).toEqual(400);
				});
			});

			describe('When layout is invalid', () => {
				it('should return status 400', async () => {
					const { loggedInClient, course } = await setup();

					const response = await loggedInClient.post(undefined, <Omit<CreateBoardBodyParams, 'layout'>>{
						title: 'new board',
						parentId: course.id,
						parentType: BoardExternalReferenceType.Course,
						layout: 'invalid',
					});

					expect(response.status).toEqual(400);
				});
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

			it('should return status 403', async () => {
				const { loggedInClient, course } = await setup();

				const response = await loggedInClient.post(undefined, <CreateBoardBodyParams>{
					title: 'new board',
					parentId: course.id,
					parentType: BoardExternalReferenceType.Course,
					layout: BoardLayout.COLUMNS,
				});

				expect(response.status).toEqual(403);
			});
		});

		describe('When user is student and has no course permission', () => {
			const setup = async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const course = courseFactory.build({ students: [studentUser] });
				await em.persistAndFlush([studentUser, course, studentAccount]);
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient, course };
			};

			it('should return status 403', async () => {
				const { loggedInClient, course } = await setup();

				const response = await loggedInClient.post(undefined, <CreateBoardBodyParams>{
					title: 'new board',
					parentId: course.id,
					parentType: BoardExternalReferenceType.Course,
					layout: BoardLayout.COLUMNS,
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

				const response = await loggedInClient.post(undefined, <CreateBoardBodyParams>{
					title: '',
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

				const response = await loggedInClient.post(undefined, <CreateBoardBodyParams>{
					title: 'a'.repeat(101),
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

				const response = await loggedInClient.post(undefined, <CreateBoardBodyParams>{
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

				const response = await loggedInClient.post(undefined, <Omit<CreateBoardBodyParams, 'parentType'>>{
					title: 'new board',
					parentId: course.id,
					parentType: 'invalid',
					layout: BoardLayout.COLUMNS,
				});

				expect(response.status).toEqual(400);
			});
		});
	});
});
