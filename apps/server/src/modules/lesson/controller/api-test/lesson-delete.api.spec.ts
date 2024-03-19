import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/core';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { LessonEntity } from '@shared/domain/entity';
import {
	TestApiClient,
	UserAndAccountTestFactory,
	courseFactory,
	courseGroupFactory,
	lessonFactory,
} from '@shared/testing';
import { ObjectId } from '@mikro-orm/mongodb';

describe('Lesson Controller (API) - delete', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [ServerTestModule],
		})
			.overrideProvider(FilesStorageClientAdapterService)
			.useValue(createMock<FilesStorageClientAdapterService>())
			.compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'lessons');
	});

	afterAll(async () => {
		await app.close();
	});

	describe('delete', () => {
		const expectedForbiddenResponse = {
			type: 'FORBIDDEN',
			title: 'Forbidden',
			message: 'Forbidden',
			code: 403,
		};

		describe('when user not exists', () => {
			const setup = async () => {
				const lesson = lessonFactory.build();

				await em.persistAndFlush([lesson]);
				em.clear();

				return { lessonId: lesson.id };
			};

			it('should response with unauthorized exception', async () => {
				const { lessonId } = await setup();

				const response = await testApiClient.delete(lessonId);

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
				expect(response.body).toEqual({
					type: 'UNAUTHORIZED',
					title: 'Unauthorized',
					message: 'Unauthorized',
					code: 401,
				});
			});

			it('should NOT delete the lesson', async () => {
				const { lessonId } = await setup();

				await testApiClient.delete(lessonId);

				const result = await em.findOne(LessonEntity, { id: lessonId });
				expect(result).toBeInstanceOf(LessonEntity);
			});
		});

		describe('when invalid params are passed', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

				await em.persistAndFlush([teacherAccount, teacherUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient };
			};

			it('should response with route not found', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.delete('');

				expect(response.statusCode).toEqual(HttpStatus.NOT_FOUND);
				expect(response.body).toEqual({
					type: 'NOT_FOUND',
					title: 'Not Found',
					message: 'Cannot DELETE /lessons/', // postman say "Cannot DELETE /api/v3/lessons/" differents result from bootstrap process, but important to note and maybe fix later for all requests
					code: 404,
				});
			});

			it('should response with api validation error', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.delete('123');

				expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
				expect(response.body).toEqual({
					type: 'API_VALIDATION_ERROR',
					title: 'API Validation Error',
					message: 'API validation failed, see validationErrors for details',
					code: 400,
					validationErrors: [{ field: ['lessonId'], errors: ['lessonId must be a mongodb id'] }],
				});
			});

			it('should response with entity not found', async () => {
				const { loggedInClient } = await setup();
				const notExistingId = new ObjectId().toHexString();

				const response = await loggedInClient.delete(notExistingId);

				expect(response.statusCode).toEqual(HttpStatus.NOT_FOUND);
				expect(response.body).toEqual({
					type: 'NOT_FOUND',
					title: 'Not Found',
					message: `The requested LessonEntity: ${notExistingId} has not been found.`,
					code: 404,
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

					const loggedInClient = await testApiClient.login(studentAccount);

					return { loggedInClient, lessonId: lesson.id };
				};

				it('should response with forbidden', async () => {
					const { lessonId, loggedInClient } = await setup();

					const response = await loggedInClient.delete(lessonId);

					expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
					expect(response.body).toEqual(expectedForbiddenResponse);
				});

				it('should NOT delete the lesson', async () => {
					const { lessonId, loggedInClient } = await setup();

					await loggedInClient.delete(lessonId);

					const result = await em.findOne(LessonEntity, { id: lessonId });
					expect(result).toBeInstanceOf(LessonEntity);
				});
			});

			describe('when lesson is part of a course and user is NOT part of it', () => {
				const setup = async () => {
					const { studentAccount, studentUser } = createStudent();
					const course = courseFactory.build({ students: [] });
					const lesson = lessonFactory.build({ course });

					await em.persistAndFlush([studentAccount, studentUser, lesson]);
					em.clear();

					const loggedInClient = await testApiClient.login(studentAccount);

					return { loggedInClient, lessonId: lesson.id };
				};

				it('should response with forbidden', async () => {
					const { lessonId, loggedInClient } = await setup();

					const response = await loggedInClient.delete(lessonId);

					expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
					expect(response.body).toEqual(expectedForbiddenResponse);
				});

				it('should NOT delete the lesson', async () => {
					const { lessonId, loggedInClient } = await setup();

					await loggedInClient.delete(lessonId);

					const result = await em.findOne(LessonEntity, { id: lessonId });
					expect(result).toBeInstanceOf(LessonEntity);
				});
			});

			describe('when lesson is part of a coursegroup and user is part of it', () => {
				const setup = async () => {
					const { studentAccount, studentUser } = createStudent();
					const courseGroup = courseGroupFactory.build({ students: [studentUser] });
					const lesson = lessonFactory.build({ courseGroup });

					await em.persistAndFlush([studentAccount, studentUser, lesson]);
					em.clear();

					const loggedInClient = await testApiClient.login(studentAccount);

					return { loggedInClient, lessonId: lesson.id };
				};

				it('should response with an empty result and status code 200', async () => {
					const { lessonId, loggedInClient } = await setup();

					const response = await loggedInClient.delete(lessonId);

					expect(response.statusCode).toEqual(HttpStatus.OK);
					expect(response.body).toEqual({});
				});

				it('should delete the lesson', async () => {
					const { lessonId, loggedInClient } = await setup();

					await loggedInClient.delete(lessonId);

					const result = await em.findOne(LessonEntity, { id: lessonId });
					expect(result).toBeNull();
				});
			});

			describe('when lesson is part of a coursegroup and user is NOT part of it', () => {
				const setup = async () => {
					const { studentAccount, studentUser } = createStudent();
					const courseGroup = courseGroupFactory.build({ students: [] });
					const lesson = lessonFactory.build({ courseGroup });

					await em.persistAndFlush([studentAccount, studentUser, lesson]);
					em.clear();

					const loggedInClient = await testApiClient.login(studentAccount);

					return { loggedInClient, lessonId: lesson.id };
				};

				it('should response with forbidden', async () => {
					const { lessonId, loggedInClient } = await setup();

					const response = await loggedInClient.delete(lessonId);

					expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
					expect(response.body).toEqual(expectedForbiddenResponse);
				});

				it('should NOT delete the lesson', async () => {
					const { lessonId, loggedInClient } = await setup();

					await loggedInClient.delete(lessonId);

					const result = await em.findOne(LessonEntity, { id: lessonId });
					expect(result).toBeInstanceOf(LessonEntity);
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

					const loggedInClient = await testApiClient.login(teacherAccount);

					return { loggedInClient, lessonId: lesson.id };
				};

				it('should response with an empty result and status code 200', async () => {
					const { lessonId, loggedInClient } = await setup();

					const response = await loggedInClient.delete(lessonId);

					expect(response.statusCode).toEqual(HttpStatus.OK);
					expect(response.body).toEqual({});
				});

				it('should delete the lesson', async () => {
					const { lessonId, loggedInClient } = await setup();

					await loggedInClient.delete(lessonId);

					const result = await em.findOne(LessonEntity, { id: lessonId });
					expect(result).toBeNull();
				});
			});

			describe('when lesson is part of a course and user NOT is part of it', () => {
				const setup = async () => {
					const { teacherAccount, teacherUser } = createTeacher();
					const course = courseFactory.build({ teachers: [] });
					const lesson = lessonFactory.build({ course });

					await em.persistAndFlush([teacherAccount, teacherUser, lesson]);
					em.clear();

					const loggedInClient = await testApiClient.login(teacherAccount);

					return { loggedInClient, lessonId: lesson.id };
				};

				it('should response with forbidden', async () => {
					const { lessonId, loggedInClient } = await setup();

					const response = await loggedInClient.delete(lessonId);

					expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
					expect(response.body).toEqual(expectedForbiddenResponse);
				});

				it('should NOT delete the lesson', async () => {
					const { lessonId, loggedInClient } = await setup();

					await loggedInClient.delete(lessonId);

					const result = await em.findOne(LessonEntity, { id: lessonId });
					expect(result).toBeInstanceOf(LessonEntity);
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

					const loggedInClient = await testApiClient.login(teacherAccount);

					return { loggedInClient, lessonId: lesson.id };
				};

				it('should response with an empty result and status code 200', async () => {
					const { lessonId, loggedInClient } = await setup();

					const response = await loggedInClient.delete(lessonId);

					expect(response.statusCode).toEqual(HttpStatus.OK);
					expect(response.body).toEqual({});
				});

				it('should delete the lesson', async () => {
					const { lessonId, loggedInClient } = await setup();

					await loggedInClient.delete(lessonId);

					const result = await em.findOne(LessonEntity, { id: lessonId });
					expect(result).toBeNull();
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

					const loggedInClient = await testApiClient.login(teacherAccount);

					return { loggedInClient, lessonId: lesson.id };
				};

				it('should response with an empty result and status code 200', async () => {
					const { lessonId, loggedInClient } = await setup();

					const response = await loggedInClient.delete(lessonId);

					expect(response.statusCode).toEqual(HttpStatus.OK);
					expect(response.body).toEqual({});
				});

				it('should delete the lesson', async () => {
					const { lessonId, loggedInClient } = await setup();

					await loggedInClient.delete(lessonId);

					const result = await em.findOne(LessonEntity, { id: lessonId });
					expect(result).toBeNull();
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

					const loggedInClient = await testApiClient.login(adminAccount);

					return { loggedInClient, lessonId: lesson.id };
				};

				it('should response with an empty result and status code 200', async () => {
					const { lessonId, loggedInClient } = await setup();

					const response = await loggedInClient.delete(lessonId);

					expect(response.statusCode).toEqual(HttpStatus.OK);
					expect(response.body).toEqual({});
				});

				it('should delete the lesson', async () => {
					const { lessonId, loggedInClient } = await setup();

					await loggedInClient.delete(lessonId);

					const result = await em.findOne(LessonEntity, { id: lessonId });
					expect(result).toBeNull();
				});
			});

			describe('when lesson is part of a course and user NOT is part of it', () => {
				const setup = async () => {
					const { adminAccount, adminUser } = createAdmin();
					const course = courseFactory.build({ teachers: [] });
					const lesson = lessonFactory.build({ course });

					await em.persistAndFlush([adminAccount, adminUser, lesson]);
					em.clear();

					const loggedInClient = await testApiClient.login(adminAccount);

					return { loggedInClient, lessonId: lesson.id };
				};

				it('should response with forbidden', async () => {
					const { lessonId, loggedInClient } = await setup();

					const response = await loggedInClient.delete(lessonId);

					expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
					expect(response.body).toEqual(expectedForbiddenResponse);
				});

				it('should NOT delete the lesson', async () => {
					const { lessonId, loggedInClient } = await setup();

					await loggedInClient.delete(lessonId);

					const result = await em.findOne(LessonEntity, { id: lessonId });
					expect(result).toBeInstanceOf(LessonEntity);
				});
			});
		});
	});
});
