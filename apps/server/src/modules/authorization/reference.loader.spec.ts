import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId } from '@shared/domain';
import { CourseRepo, FileRecordRepo, SchoolRepo, TaskRepo, UserRepo } from '@shared/repo';
import { roleFactory, setupEntities, userFactory } from '@shared/testing';
import { AllowedAuthorizationEntityType } from './interfaces';
import { ReferenceLoader } from './reference.loader';

describe('reference.loader', () => {
	let orm: MikroORM;
	let service: ReferenceLoader;
	let userRepo: DeepMocked<UserRepo>;
	let courseRepo: DeepMocked<CourseRepo>;
	let taskRepo: DeepMocked<TaskRepo>;
	let schoolRepo: DeepMocked<SchoolRepo>;
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
					provide: TaskRepo,
					useValue: createMock<TaskRepo>(),
				},
				{
					provide: FileRecordRepo,
					useValue: createMock<FileRecordRepo>(),
				},
				{
					provide: SchoolRepo,
					useValue: createMock<SchoolRepo>(),
				},
			],
		}).compile();

		service = await module.get(ReferenceLoader);
		userRepo = await module.get(UserRepo);
		courseRepo = await module.get(CourseRepo);
		taskRepo = await module.get(TaskRepo);
		schoolRepo = await module.get(SchoolRepo);
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

		it('should call schoolRepo.findById', async () => {
			await service.loadEntity(AllowedAuthorizationEntityType.School, entityId);
			expect(schoolRepo.findById).toBeCalledWith(entityId);
		});
		it('should call userRepo.findById', async () => {
			await service.loadEntity(AllowedAuthorizationEntityType.User, entityId);
			expect(userRepo.findById).toBeCalledWith(entityId);
		});

		it('should return entity', async () => {
			const user = userFactory.build();
			userRepo.findById.mockResolvedValue(user);
			const result = await service.loadEntity(AllowedAuthorizationEntityType.User, entityId);
			expect(result).toBe(user);
		});

		it('should call ReferenceLoader.getUserWithPermissions', () => {
			void expect(async () =>
				service.loadEntity('AllowedEntityType.User' as AllowedAuthorizationEntityType.User, entityId)
			).rejects.toThrow();
		});
	});

	describe('getUserWithPermissions', () => {
		it('should return user entity', async () => {
			const roles = [roleFactory.build()];
			const user = userFactory.buildWithId({ roles });
			userRepo.findById.mockResolvedValue(user);
			const result = await service.getUserWithPermissions(entityId);
			expect(result).toBe(user);
		});
	});
});
