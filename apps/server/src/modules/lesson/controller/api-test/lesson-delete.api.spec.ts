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
			});
		});

		describe('given user is a student', () => {
			const setupUser = () => UserAndAccountTestFactory.buildStudent();

			describe('when lesson is part of a course and user is part of it', () => {
				const setup = async () => {
					const { studentAccount, studentUser } = setupUser();
					const course = courseFactory.build({ students: [studentUser] });
					const lesson = lessonFactory.build({ course });

					await em.persistAndFlush([studentAccount, studentUser, lesson]);

					return { studentAccount, lessonId: lesson.id };
				};

				it('it should throw a forbidden', async () => {
					const { lessonId, studentAccount } = await setup();

					const response = await request.delete(lessonId, studentAccount);

					expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
				});
			});

			describe('when lesson is part of a course and user is NOT part of it', () => {
				const setup = async () => {
					const { studentAccount, studentUser } = setupUser();
					const course = courseFactory.build({ students: [] });
					const lesson = lessonFactory.build({ course });

					await em.persistAndFlush([studentAccount, studentUser, lesson]);

					return { studentAccount, lessonId: lesson.id };
				};

				it('it should throw a forbidden', async () => {
					const { lessonId, studentAccount } = await setup();

					const response = await request.delete(lessonId, studentAccount);

					expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
				});
			});

			describe('when lesson is part of a coursegroup and user is part of it', () => {
				const setup = async () => {
					const { studentAccount, studentUser } = setupUser();
					const courseGroup = courseGroupFactory.build({ students: [studentUser] });
					const lesson = lessonFactory.build({ courseGroup });

					await em.persistAndFlush([studentAccount, studentUser, lesson]);

					return { studentAccount, lessonId: lesson.id };
				};

				it('it should delete the lesson', async () => {
					const { lessonId, studentAccount } = await setup();

					const response = await request.delete(lessonId, studentAccount);

					expect(response.statusCode).toEqual(HttpStatus.OK);
					// return value match
				});
			});

			describe('when lesson is part of a coursegroup and user is NOT part of it', () => {
				const setup = async () => {
					const { studentAccount, studentUser } = setupUser();
					const courseGroup = courseGroupFactory.build({ students: [] });
					const lesson = lessonFactory.build({ courseGroup });

					await em.persistAndFlush([studentAccount, studentUser, lesson]);

					return { studentAccount, lessonId: lesson.id };
				};

				it('it should delete the lesson', async () => {
					const { lessonId, studentAccount } = await setup();

					const response = await request.delete(lessonId, studentAccount);

					expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
					// return value match
				});
			});
		});

		describe('given user is a teacher', () => {
			const setupUser = () => UserAndAccountTestFactory.buildTeacher();

			describe('when lesson is part of a course and user is part of it', () => {
				const setup = async () => {
					const { teacherAccount, teacherUser } = setupUser();
					const course = courseFactory.build({ teachers: [teacherUser] });
					const lesson = lessonFactory.build({ course });

					await em.persistAndFlush([teacherAccount, teacherUser, lesson]);

					return { teacherAccount, lessonId: lesson.id };
				};

				it('it should delete the lesson', async () => {
					const { lessonId, teacherAccount } = await setup();

					const response = await request.delete(lessonId, teacherAccount);

					expect(response.statusCode).toEqual(HttpStatus.OK);
				});
			});

			describe('when lesson is part of a course and user NOT is part of it', () => {
				const setup = async () => {
					const { teacherAccount, teacherUser } = setupUser();
					const course = courseFactory.build({ teachers: [] });
					const lesson = lessonFactory.build({ course });

					await em.persistAndFlush([teacherAccount, teacherUser, lesson]);

					return { teacherAccount, lessonId: lesson.id };
				};

				it('it should delete the lesson', async () => {
					const { lessonId, teacherAccount } = await setup();

					const response = await request.delete(lessonId, teacherAccount);

					expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
				});
			});

			describe('when lesson is part of a coursegroup and user is part of the related course as teacher', () => {
				const setup = async () => {
					const { teacherAccount, teacherUser } = setupUser();
					const course = courseFactory.build({ teachers: [teacherUser] });
					const courseGroup = courseGroupFactory.build({ students: [], course });
					const lesson = lessonFactory.build({ courseGroup });

					await em.persistAndFlush([teacherAccount, teacherUser, lesson]);

					return { teacherAccount, lessonId: lesson.id };
				};

				it('it should delete the lesson', async () => {
					const { lessonId, teacherAccount } = await setup();

					const response = await request.delete(lessonId, teacherAccount);

					expect(response.statusCode).toEqual(HttpStatus.OK);
					// return value match
				});
			});

			describe('when lesson is part of a coursegroup and user is part of the related course as substitution teacher', () => {
				const setup = async () => {
					const { teacherAccount, teacherUser } = setupUser();
					const course = courseFactory.build({ substitutionTeachers: [teacherUser] });
					const courseGroup = courseGroupFactory.build({ students: [], course });
					const lesson = lessonFactory.build({ courseGroup });

					await em.persistAndFlush([teacherAccount, teacherUser, lesson]);

					return { teacherAccount, lessonId: lesson.id };
				};

				it('it should delete the lesson', async () => {
					const { lessonId, teacherAccount } = await setup();

					const response = await request.delete(lessonId, teacherAccount);

					expect(response.statusCode).toEqual(HttpStatus.OK);
					// return value match
				});
			});
		});

		describe('given user is a admin', () => {
			const setupUser = () => UserAndAccountTestFactory.buildAdmin();

			describe('when lesson is part of a course and user is part of it', () => {
				const setup = async () => {
					const { adminAccount, adminUser } = setupUser();
					const course = courseFactory.build({ substitutionTeachers: [adminUser] });
					const lesson = lessonFactory.build({ course });

					await em.persistAndFlush([adminAccount, adminUser, lesson]);

					return { adminAccount, lessonId: lesson.id };
				};

				it('it should throw a forbidden', async () => {
					const { lessonId, adminAccount } = await setup();

					const response = await request.delete(lessonId, adminAccount);

					expect(response.statusCode).toEqual(HttpStatus.OK);
				});
			});

			describe('when lesson is part of a course and user NOT is part of it', () => {
				const setup = async () => {
					const { adminAccount, adminUser } = setupUser();
					const course = courseFactory.build({ teachers: [] });
					const lesson = lessonFactory.build({ course });

					await em.persistAndFlush([adminAccount, adminUser, lesson]);

					return { adminAccount, lessonId: lesson.id };
				};

				it('it should throw forbidden', async () => {
					const { lessonId, adminAccount } = await setup();

					const response = await request.delete(lessonId, adminAccount);

					expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
				});
			});
		});
	});
});
