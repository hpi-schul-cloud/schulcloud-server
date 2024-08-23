import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons';
import { ICurrentUser, JwtAuthGuard } from '@infra/auth-guard';
import { EntityManager } from '@mikro-orm/mongodb';
import { CopyApiResponse } from '@modules/copy-helper';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { SingleColumnBoardResponse } from '@modules/learnroom/controller/dto';
import { ServerTestModule } from '@modules/server/server.module';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Course, LegacyBoard, Task } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import {
	boardFactory,
	cleanupCollections,
	courseFactory,
	lessonFactory,
	mapUserToCurrentUser,
	roleFactory,
	taskFactory,
	userFactory,
} from '@shared/testing';
import { Request } from 'express';
import request from 'supertest';

describe('Course Rooms Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let currentUser: ICurrentUser;
	let filesStorageClientAdapterService: DeepMocked<FilesStorageClientAdapterService>;

	const setConfig = () => {
		Configuration.set('FEATURE_COPY_SERVICE_ENABLED', true);
	};

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		})
			.overrideProvider(FilesStorageClientAdapterService)
			.useValue(createMock<FilesStorageClientAdapterService>())
			.overrideGuard(JwtAuthGuard)
			.useValue({
				canActivate(context: ExecutionContext) {
					const req: Request = context.switchToHttp().getRequest();
					req.user = currentUser;
					return true;
				},
			})
			.compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		filesStorageClientAdapterService = app.get(FilesStorageClientAdapterService);
		setConfig();
	});

	afterAll(async () => {
		await cleanupCollections(em);
		await app.close();
	});

	it('[GET] board', async () => {
		const roles = roleFactory.buildList(1, { permissions: [] });
		const student = userFactory.build({ roles });
		const course = courseFactory.build({ students: [student] });
		const task = taskFactory.build({ course });

		await em.persistAndFlush([course, task]);
		em.clear();

		currentUser = mapUserToCurrentUser(student);

		const response = await request(app.getHttpServer()).get(`/rooms/${course.id}/board`);

		expect(response.status).toEqual(200);
		const body = response.body as SingleColumnBoardResponse;
		expect(body.roomId).toEqual(course.id);
	});

	describe('[PATCH] ElementVisibility', () => {
		it('should return 200', async () => {
			const roles = roleFactory.buildList(1, { permissions: [] });
			const teacher = userFactory.build({ roles });
			const course = courseFactory.build({ teachers: [teacher] });
			const board = boardFactory.buildWithId({ course });
			const task = taskFactory.draft().build({ course });
			board.syncBoardElementReferences([task]);

			await em.persistAndFlush([course, board, task]);
			em.clear();

			currentUser = mapUserToCurrentUser(teacher);
			const params = { visibility: true };

			const response = await request(app.getHttpServer())
				.patch(`/rooms/${course.id}/elements/${task.id}/visibility`)
				.send(params);

			expect(response.status).toEqual(200);
		});

		it('should make task visible', async () => {
			const roles = roleFactory.buildList(1, { permissions: [] });
			const teacher = userFactory.build({ roles });
			const course = courseFactory.build({ teachers: [teacher] });
			const board = boardFactory.buildWithId({ course });
			const task = taskFactory.draft().build({ course });
			board.syncBoardElementReferences([task]);

			await em.persistAndFlush([course, board, task]);
			em.clear();

			currentUser = mapUserToCurrentUser(teacher);
			const params = { visibility: true };

			await request(app.getHttpServer()).patch(`/rooms/${course.id}/elements/${task.id}/visibility`).send(params);
			const updatedTask = await em.findOneOrFail(Task, task.id);

			expect(updatedTask.isDraft()).toEqual(false);
		});

		it('should make task invisibible', async () => {
			const roles = roleFactory.buildList(1, { permissions: [] });
			const teacher = userFactory.build({ roles });
			const course = courseFactory.build({ teachers: [teacher] });
			const board = boardFactory.buildWithId({ course });
			const task = taskFactory.build({ course });
			board.syncBoardElementReferences([task]);

			await em.persistAndFlush([course, board, task]);
			em.clear();

			currentUser = mapUserToCurrentUser(teacher);
			const params = { visibility: false };

			await request(app.getHttpServer()).patch(`/rooms/${course.id}/elements/${task.id}/visibility`).send(params);
			const updatedTask = await em.findOneOrFail(Task, task.id);

			expect(updatedTask.isDraft()).toEqual(true);
		});
	});

	describe('[PATCH] order', () => {
		it('should return 200', async () => {
			const roles = roleFactory.buildList(1, { permissions: [] });
			const teacher = userFactory.build({ roles });
			const course = courseFactory.build({ teachers: [teacher] });
			const board = boardFactory.buildWithId({ course });
			const tasks = taskFactory.buildList(3, { course });
			const lessons = lessonFactory.buildList(3, { course });
			board.syncBoardElementReferences([...tasks, ...lessons]);

			await em.persistAndFlush([course, board, ...tasks, ...lessons]);
			em.clear();

			currentUser = mapUserToCurrentUser(teacher);
			const params = {
				elements: [tasks[2], lessons[1], tasks[0], lessons[2], tasks[1], lessons[0]].map((el) => el.id),
			};

			const response = await request(app.getHttpServer())
				.patch(`/rooms/${course.id}/board/order`)
				.set('Authorization', 'jwt')
				.send(params);

			expect(response.status).toEqual(200);
		});
	});

	describe('[POST] copy', () => {
		it('should return 201', async () => {
			const roles = roleFactory.buildList(1, { permissions: [Permission.COURSE_CREATE] });
			const teacher = userFactory.build({ roles });
			const course = courseFactory.build({ teachers: [teacher] });

			await em.persistAndFlush([course]);
			em.clear();

			currentUser = mapUserToCurrentUser(teacher);

			const response = await request(app.getHttpServer())
				.post(`/rooms/${course.id}/copy`)
				.set('Authorization', 'jwt')
				.send();

			expect(response.status).toEqual(201);
		});

		it('should return id of copied element', async () => {
			const roles = roleFactory.buildList(1, { permissions: [Permission.COURSE_CREATE] });
			const teacher = userFactory.build({ roles });
			const course = courseFactory.build({ teachers: [teacher] });

			await em.persistAndFlush([course]);
			em.clear();

			currentUser = mapUserToCurrentUser(teacher);

			const response = await request(app.getHttpServer())
				.post(`/rooms/${course.id}/copy`)
				.set('Authorization', 'jwt')
				.send();
			const body = response.body as CopyApiResponse;
			expect(body.id).toBeDefined();

			expect(() => em.findOneOrFail(Course, body.id as string)).not.toThrow();
		});

		it('should persist board of room copy', async () => {
			const roles = roleFactory.buildList(1, { permissions: [Permission.COURSE_CREATE] });
			const teacher = userFactory.build({ roles });
			const course = courseFactory.build({ teachers: [teacher] });
			const board = boardFactory.build({ course });

			await em.persistAndFlush([course, board]);
			em.clear();

			currentUser = mapUserToCurrentUser(teacher);

			const response = await request(app.getHttpServer())
				.post(`/rooms/${course.id}/copy`)
				.set('Authorization', 'jwt')
				.send();
			const body = response.body as CopyApiResponse;
			expect(body.id).toBeDefined();

			expect(() => em.findOneOrFail(LegacyBoard, { course: body.id as string })).not.toThrow();
		});

		it('complete example', async () => {
			const roles = roleFactory.buildList(1, { permissions: [Permission.COURSE_CREATE] });
			const teacher = userFactory.build({ roles });
			const course = courseFactory.build({ teachers: [teacher] });

			const board = boardFactory.buildWithId({ course });
			const tasks = taskFactory.buildList(3, { course });
			const lessons = lessonFactory.buildList(3, { course });
			board.syncBoardElementReferences([...tasks, ...lessons]);

			await em.persistAndFlush([course, board, ...tasks, ...lessons]);
			em.clear();

			currentUser = mapUserToCurrentUser(teacher);

			filesStorageClientAdapterService.copyFilesOfParent.mockResolvedValue([]);

			const response = await request(app.getHttpServer())
				.post(`/rooms/${course.id}/copy`)
				.set('Authorization', 'jwt')
				.send();

			expect(response.status).toEqual(201);
		});
	});

	describe('[POST] lesson copy', () => {
		it('should return 201', async () => {
			const roles = roleFactory.buildList(1, { permissions: [Permission.TOPIC_CREATE] });
			const teacher = userFactory.build({ roles });
			const course = courseFactory.build({ teachers: [teacher] });
			const lesson = lessonFactory.build({ course });

			await em.persistAndFlush([lesson]);
			em.clear();

			currentUser = mapUserToCurrentUser(teacher);

			const response = await request(app.getHttpServer())
				.post(`/rooms/lessons/${lesson.id}/copy`)
				.set('Authorization', 'jwt')
				.send({ courseId: course.id });

			expect(response.status).toEqual(201);
		});
	});
});
