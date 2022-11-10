import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { NotImplementedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId } from '@shared/domain';
import { CourseGroupRepo, CourseRepo, LessonRepo, SchoolRepo, TaskRepo, TeamsRepo, UserRepo } from '@shared/repo';
import { setupEntities, userFactory } from '@shared/testing';
import { AllowedAuthorizationEntityType } from './interfaces';
import { ReferenceLoader } from './reference.loader';

describe('reference.loader', () => {
	let orm: MikroORM;
	let service: ReferenceLoader;
	let userRepo: DeepMocked<UserRepo>;
	let courseRepo: DeepMocked<CourseRepo>;
	let courseGroupRepo: DeepMocked<CourseGroupRepo>;
	let taskRepo: DeepMocked<TaskRepo>;
	let schoolRepo: DeepMocked<SchoolRepo>;
	let lessonRepo: DeepMocked<LessonRepo>;
	let teamsRepo: DeepMocked<TeamsRepo>;
	const entityId: EntityId = new ObjectId().toHexString();

	beforeAll(async () => {
		orm = await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ReferenceLoader,
				{
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
				},
				{
					provide: CourseRepo,
					useValue: createMock<CourseRepo>(),
				},
				{
					provide: CourseGroupRepo,
					useValue: createMock<CourseGroupRepo>(),
				},
				{
					provide: TaskRepo,
					useValue: createMock<TaskRepo>(),
				},
				{
					provide: SchoolRepo,
					useValue: createMock<SchoolRepo>(),
				},
				{
					provide: LessonRepo,
					useValue: createMock<LessonRepo>(),
				},
				{
					provide: TeamsRepo,
					useValue: createMock<TeamsRepo>(),
				},
			],
		}).compile();

		service = await module.get(ReferenceLoader);
		userRepo = await module.get(UserRepo);
		courseRepo = await module.get(CourseRepo);
		courseGroupRepo = await module.get(CourseGroupRepo);
		taskRepo = await module.get(TaskRepo);
		schoolRepo = await module.get(SchoolRepo);
		lessonRepo = await module.get(LessonRepo);
		teamsRepo = await module.get(TeamsRepo);
	});

	afterAll(async () => {
		await orm.close();
	});

	it('should to be defined', () => {
		expect(service).toBeDefined();
	});

	describe('loadEntity', () => {
		it('should call taskRepo.findById', async () => {
			await service.loadEntity(AllowedAuthorizationEntityType.Task, entityId);

			expect(taskRepo.findById).toBeCalledWith(entityId);
		});

		it('should call courseRepo.findById', async () => {
			await service.loadEntity(AllowedAuthorizationEntityType.Course, entityId);

			expect(courseRepo.findById).toBeCalledWith(entityId);
		});

		it('should call courseGroupRepo.findById', async () => {
			await service.loadEntity(AllowedAuthorizationEntityType.CourseGroup, entityId);

			expect(courseGroupRepo.findById).toBeCalledWith(entityId);
		});

		it('should call schoolRepo.findById', async () => {
			await service.loadEntity(AllowedAuthorizationEntityType.School, entityId);

			expect(schoolRepo.findById).toBeCalledWith(entityId);
		});

		it('should call userRepo.findById', async () => {
			await service.loadEntity(AllowedAuthorizationEntityType.User, entityId);

			expect(userRepo.findById).toBeCalledWith(entityId, true);
		});

		it('should call lessonRepo.findById', async () => {
			await service.loadEntity(AllowedAuthorizationEntityType.Lesson, entityId);

			expect(lessonRepo.findById).toBeCalledWith(entityId);
		});

		it('should call teamsRepo.findById', async () => {
			await service.loadEntity(AllowedAuthorizationEntityType.Team, entityId);

			expect(teamsRepo.findById).toBeCalledWith(entityId, true);
		});

		it('should return entity', async () => {
			const user = userFactory.build();
			userRepo.findById.mockResolvedValue(user);

			const result = await service.loadEntity(AllowedAuthorizationEntityType.User, entityId);

			expect(result).toBe(user);
		});

		it('should throw on unknown authorization entity type', () => {
			void expect(async () =>
				service.loadEntity('NotAllowedEntityType' as AllowedAuthorizationEntityType, entityId)
			).rejects.toThrow(NotImplementedException);
		});
	});
});
