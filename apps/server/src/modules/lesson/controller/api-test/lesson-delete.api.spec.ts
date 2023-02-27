import { createMock } from '@golevelup/ts-jest';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ICurrentUser, Permission, User } from '@shared/domain';
import {
	cleanupCollections,
	courseFactory,
	courseGroupFactory,
	lessonFactory,
	mapUserToCurrentUser,
	roleFactory,
	userFactory,
} from '@shared/testing';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
import { ServerTestModule } from '@src/modules/server';
import { Request } from 'express';
import request from 'supertest';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	delete(lessonId: string) {
		return request(this.app.getHttpServer()).delete(`/lessons/${lessonId}`).set('Accept', 'application/json');
	}
}

describe('Lesson Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let currentUser: ICurrentUser;
	let api: API;

	const setupUser = async (permissions: Permission[]) => {
		const roles = roleFactory.buildList(1, {
			permissions,
		});
		const user = userFactory.build({ roles });
		await em.persistAndFlush([user]);
		em.clear();
		currentUser = mapUserToCurrentUser(user);
		return user;
	};

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
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
			.overrideProvider(FilesStorageClientAdapterService)
			.useValue(createMock<FilesStorageClientAdapterService>())
			.compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		api = new API(app);
	});

	afterAll(async () => {
		await cleanupCollections(em);
		await app.close();
	});

	describe('Bad requests', () => {
		describe('when currentUser undefined', () => {
			it('should return UNAUTHORIZED', async () => {
				// @ts-expect-error: Test case
				currentUser = undefined;

				await api.delete(new ObjectId().toHexString()).expect({
					type: 'UNAUTHORIZED',
					title: 'Unauthorized',
					message: 'CurrentUser missing in request context. This route requires jwt authentication guard enabled.',
					code: 401,
				});
			});
		});

		describe('when request param is not mongodb id', () => {
			let user: User;

			beforeEach(async () => {
				user = await setupUser([]);
				currentUser = mapUserToCurrentUser(user);
			});

			it('should return API_VALIDATION_ERROR', async () => {
				// @ts-expect-error: Test case
				await api.delete(undefined).expect({
					type: 'API_VALIDATION_ERROR',
					title: 'API Validation Error',
					message: 'API validation failed, see validationErrors for details',
					code: 400,
					validationErrors: [{ field: ['lessonId'], errors: ['lessonId must be a mongodb id'] }],
				});
			});
		});
	});

	describe('Authorization and permissions', () => {
		describe('when lesson is in course', () => {
			const setupLessonInCourse = async (
				teachers: User[] = [],
				substitutionTeachers: User[] = [],
				students: User[] = []
			) => {
				const course = courseFactory.buildWithId({ teachers, substitutionTeachers, students });
				const lesson = lessonFactory.buildWithId({ course });

				await em.persistAndFlush([lesson, course]);
				em.clear();

				return { lesson };
			};

			describe('when user is teacher', () => {
				const setup = async () => {
					const user = await setupUser([Permission.TOPIC_VIEW]);
					const { lesson } = await setupLessonInCourse([user]);
					return lesson;
				};

				it('should return status 200', async () => {
					const lesson = await setup();

					await api.delete(lesson.id).expect(200);
				});
			});

			describe('when user is substitution teacher', () => {
				const setup = async () => {
					const user = await setupUser([Permission.TOPIC_VIEW]);
					const { lesson } = await setupLessonInCourse([], [user]);
					return lesson;
				};

				it('should return status 200', async () => {
					const lesson = await setup();

					await api.delete(lesson.id).expect(200);
				});
			});

			describe('when user is student', () => {
				const setup = async () => {
					const user = await setupUser([Permission.TOPIC_VIEW]);
					const { lesson } = await setupLessonInCourse([], [], [user]);
					return lesson;
				};

				it('should return status 403', async () => {
					const lesson = await setup();

					await api.delete(lesson.id).expect(403);
				});
			});

			describe('when user is not user form course', () => {
				const setup = async () => {
					await setupUser([Permission.TOPIC_VIEW]);
					const { lesson } = await setupLessonInCourse();
					return lesson;
				};

				it('should return status 403', async () => {
					const lesson = await setup();

					await api.delete(lesson.id).expect(403);
				});
			});
		});

		describe('when lesson is in courseGroup', () => {
			const setupLessonInCourseGroup = async (
				teachers: User[] = [],
				substitutionTeachers: User[] = [],
				students: User[] = []
			) => {
				const course = courseFactory.buildWithId({ teachers, substitutionTeachers, students });
				const courseGroup = courseGroupFactory.buildWithId({ course, students });
				const lesson = lessonFactory.buildWithId({ courseGroup });

				await em.persistAndFlush([lesson, course, courseGroup]);
				em.clear();

				return { lesson };
			};

			describe('when user is teacher', () => {
				const setup = async () => {
					const user = await setupUser([Permission.TOPIC_VIEW]);
					const { lesson } = await setupLessonInCourseGroup([user]);

					return lesson;
				};

				it('should return status 200', async () => {
					const lesson = await setup();

					await api.delete(lesson.id).expect(200);
				});
			});

			describe('when user is substitution teacher', () => {
				const setup = async () => {
					const user = await setupUser([Permission.TOPIC_VIEW]);
					const { lesson } = await setupLessonInCourseGroup([], [user]);

					return lesson;
				};

				it('should return status 200', async () => {
					const lesson = await setup();

					await api.delete(lesson.id).expect(200);
				});
			});

			describe('when user is student', () => {
				const setup = async () => {
					const user = await setupUser([Permission.TOPIC_VIEW]);
					const { lesson } = await setupLessonInCourseGroup([], [], [user]);

					return lesson;
				};

				it('should return status 200', async () => {
					const lesson = await setup();

					await api.delete(lesson.id).expect(200);
				});
			});

			describe('when user is not user form courseGroup', () => {
				const setup = async () => {
					await setupUser([Permission.TOPIC_VIEW]);
					const { lesson } = await setupLessonInCourseGroup();

					return lesson;
				};

				it('should return status 403', async () => {
					const lesson = await setup();

					await api.delete(lesson.id).expect(403);
				});
			});

			describe('when user is student in course and not in courseGroup', () => {
				const setup = async () => {
					const user = await setupUser([Permission.TOPIC_VIEW]);
					const course = courseFactory.buildWithId({ students: [user] });
					const courseGroup = courseGroupFactory.buildWithId({ course });
					const lesson = lessonFactory.buildWithId({ courseGroup });

					await em.persistAndFlush([lesson, course, courseGroup]);
					em.clear();

					return lesson;
				};

				it('should return status 403', async () => {
					const lesson = await setup();

					await api.delete(lesson.id).expect(403);
				});
			});
		});
	});
});
