import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/core';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
	courseFactory,
	courseGroupFactory,
	lessonFactory,
	TestRequest,
	UserAndAccountTestFactory,
} from '@shared/testing';
import { FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
import { ServerTestModule } from '@src/modules/server';

describe('Lesson Controller (API) - delete', () => {
	let app: INestApplication;
	let em: EntityManager;
	let request: TestRequest;

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		})
			.overrideProvider(FilesStorageClientAdapterService)
			.useValue(createMock<FilesStorageClientAdapterService>())
			.compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		request = new TestRequest(app, 'lessons');
	});

	afterAll(async () => {
		await app.close();
	});

	describe('delete', () => {
		describe('when user not exists', () => {
			const setup = async () => {
				const lesson = lessonFactory.build();

				await em.persistAndFlush([lesson]);
				em.clear();

				return { lessonId: lesson.id };
			};

			it('should throw an unauthorized exception', async () => {
				const { lessonId } = await setup();

				const response = await request.delete(lessonId);

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
				expect(response.body).toEqual({
					type: 'UNAUTHORIZED',
					title: 'Unauthorized',
					message: 'Unauthorized',
					code: 401,
				});
			});
		});

		describe('when invalid params are passed', () => {
			const setup = async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persistAndFlush([studentAccount, studentUser]);
				em.clear();

				return { studentAccount };
			};

			it('it should response with api validation error', async () => {
				const { studentAccount } = await setup();

				const response = await request.delete(undefined, studentAccount);

				expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
				expect(response.body).toEqual({
					type: 'API_VALIDATION_ERROR',
					title: 'API Validation Error',
					message: 'API validation failed, see validationErrors for details',
					code: 400,
					validationErrors: [{ field: ['lessonId'], errors: ['lessonId must be a mongodb id'] }],
				});
			});
		});

		describe('given user is a student', () => {
			const createStudent = () => UserAndAccountTestFactory.buildStudent();

			describe('when lesson is part of a course and user is part of it', () => {
				const setup = async () => {
					const { studentAccount, studentUser } = createStudent();
					const course = courseFactory.build({ students: [studentUser] });
					const lesson = lessonFactory.build({ course });

					await em.persistAndFlush([studentAccount, studentUser, lesson]);
					em.clear();

					return { studentAccount, lessonId: lesson.id };
				};

				it('it should respond with forbidden', async () => {
					const { lessonId, studentAccount } = await setup();

					const response = await request.delete(lessonId, studentAccount);

					expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
					expect(response.body).toEqual({
						type: 'FORBIDDEN',
						title: 'Forbidden',
						message: 'Forbidden',
						code: 403,
					});
				});
			});

			describe('when lesson is part of a course and user is NOT part of it', () => {
				const setup = async () => {
					const { studentAccount, studentUser } = createStudent();
					const course = courseFactory.build({ students: [] });
					const lesson = lessonFactory.build({ course });

					await em.persistAndFlush([studentAccount, studentUser, lesson]);
					em.clear();

					return { studentAccount, lessonId: lesson.id };
				};

				it('it should respond with forbidden', async () => {
					const { lessonId, studentAccount } = await setup();

					const response = await request.delete(lessonId, studentAccount);

					expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
					expect(response.body).toEqual({
						type: 'FORBIDDEN',
						title: 'Forbidden',
						message: 'Forbidden',
						code: 403,
					});
				});
			});

			describe('when lesson is part of a coursegroup and user is part of it', () => {
				const setup = async () => {
					const { studentAccount, studentUser } = createStudent();
					const courseGroup = courseGroupFactory.build({ students: [studentUser] });
					const lesson = lessonFactory.build({ courseGroup });

					await em.persistAndFlush([studentAccount, studentUser, lesson]);
					em.clear();

					return { studentAccount, lessonId: lesson.id };
				};

				it('it should delete the lesson', async () => {
					const { lessonId, studentAccount } = await setup();

					const response = await request.delete(lessonId, studentAccount);

					expect(response.statusCode).toEqual(HttpStatus.OK);
					expect(response.body).toEqual({});
				});
			});

			describe('when lesson is part of a coursegroup and user is NOT part of it', () => {
				const setup = async () => {
					const { studentAccount, studentUser } = createStudent();
					const courseGroup = courseGroupFactory.build({ students: [] });
					const lesson = lessonFactory.build({ courseGroup });

					await em.persistAndFlush([studentAccount, studentUser, lesson]);
					em.clear();

					return { studentAccount, lessonId: lesson.id };
				};

				it('it should respond with forbidden', async () => {
					const { lessonId, studentAccount } = await setup();

					const response = await request.delete(lessonId, studentAccount);

					expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
					expect(response.body).toEqual({
						type: 'FORBIDDEN',
						title: 'Forbidden',
						message: 'Forbidden',
						code: 403,
					});
				});
			});
		});

		describe('given user is a teacher', () => {
			const createTeacher = () => UserAndAccountTestFactory.buildTeacher();

			describe('when lesson is part of a course and user is part of it', () => {
				const setup = async () => {
					const { teacherAccount, teacherUser } = createTeacher();
					const course = courseFactory.build({ teachers: [teacherUser] });
					const lesson = lessonFactory.build({ course });

					await em.persistAndFlush([teacherAccount, teacherUser, lesson]);
					em.clear();

					return { teacherAccount, lessonId: lesson.id };
				};

				it('it should delete the lesson', async () => {
					const { lessonId, teacherAccount } = await setup();

					const response = await request.delete(lessonId, teacherAccount);

					expect(response.statusCode).toEqual(HttpStatus.OK);
					expect(response.body).toEqual({});
				});
			});

			describe('when lesson is part of a course and user NOT is part of it', () => {
				const setup = async () => {
					const { teacherAccount, teacherUser } = createTeacher();
					const course = courseFactory.build({ teachers: [] });
					const lesson = lessonFactory.build({ course });

					await em.persistAndFlush([teacherAccount, teacherUser, lesson]);
					em.clear();

					return { teacherAccount, lessonId: lesson.id };
				};

				it('it should respond with forbidden', async () => {
					const { lessonId, teacherAccount } = await setup();

					const response = await request.delete(lessonId, teacherAccount);

					expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
					expect(response.body).toEqual({
						type: 'FORBIDDEN',
						title: 'Forbidden',
						message: 'Forbidden',
						code: 403,
					});
				});
			});

			describe('when lesson is part of a coursegroup and user is part of the related course as teacher', () => {
				const setup = async () => {
					const { teacherAccount, teacherUser } = createTeacher();
					const course = courseFactory.build({ teachers: [teacherUser] });
					const courseGroup = courseGroupFactory.build({ students: [], course });
					const lesson = lessonFactory.build({ courseGroup });

					await em.persistAndFlush([teacherAccount, teacherUser, lesson]);
					em.clear();

					return { teacherAccount, lessonId: lesson.id };
				};

				it('it should delete the lesson', async () => {
					const { lessonId, teacherAccount } = await setup();

					const response = await request.delete(lessonId, teacherAccount);

					expect(response.statusCode).toEqual(HttpStatus.OK);
					expect(response.body).toEqual({});
				});
			});

			describe('when lesson is part of a coursegroup and user is part of the related course as substitution teacher', () => {
				const setup = async () => {
					const { teacherAccount, teacherUser } = createTeacher();
					const course = courseFactory.build({ substitutionTeachers: [teacherUser] });
					const courseGroup = courseGroupFactory.build({ students: [], course });
					const lesson = lessonFactory.build({ courseGroup });

					await em.persistAndFlush([teacherAccount, teacherUser, lesson]);
					em.clear();

					return { teacherAccount, lessonId: lesson.id };
				};

				it('it should delete the lesson', async () => {
					const { lessonId, teacherAccount } = await setup();

					const response = await request.delete(lessonId, teacherAccount);

					expect(response.statusCode).toEqual(HttpStatus.OK);
					expect(response.body).toEqual({});
				});
			});
		});

		describe('given user is a admin', () => {
			const createAdmin = () => UserAndAccountTestFactory.buildAdmin();

			describe('when lesson is part of a course and user is part of it', () => {
				const setup = async () => {
					const { adminAccount, adminUser } = createAdmin();
					const course = courseFactory.build({ substitutionTeachers: [adminUser] });
					const lesson = lessonFactory.build({ course });

					await em.persistAndFlush([adminAccount, adminUser, lesson]);
					em.clear();

					return { adminAccount, lessonId: lesson.id };
				};

				it('it should delete the lesson', async () => {
					const { lessonId, adminAccount } = await setup();

					const response = await request.delete(lessonId, adminAccount);

					expect(response.statusCode).toEqual(HttpStatus.OK);
					expect(response.body).toEqual({});
				});
			});

			describe('when lesson is part of a course and user NOT is part of it', () => {
				const setup = async () => {
					const { adminAccount, adminUser } = createAdmin();
					const course = courseFactory.build({ teachers: [] });
					const lesson = lessonFactory.build({ course });

					await em.persistAndFlush([adminAccount, adminUser, lesson]);
					em.clear();

					return { adminAccount, lessonId: lesson.id };
				};

				it('it should throw forbidden', async () => {
					const { lessonId, adminAccount } = await setup();

					const response = await request.delete(lessonId, adminAccount);

					expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
					expect(response.body).toEqual({
						type: 'FORBIDDEN',
						title: 'Forbidden',
						message: 'Forbidden',
						code: 403,
					});
				});
			});
		});
	});
});
