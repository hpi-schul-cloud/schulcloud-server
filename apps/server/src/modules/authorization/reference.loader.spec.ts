import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { NotImplementedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId } from '@shared/domain';
import {
	CourseGroupRepo,
	CourseRepo,
	LessonRepo,
	SchoolExternalToolRepo,
	SchoolRepo,
	SubmissionRepo,
	TaskRepo,
	TeamsRepo,
	UserRepo,
} from '@shared/repo';
import { roleFactory, setupEntities, userFactory } from '@shared/testing';
import { BoardNodeService } from '@src/modules/board';
import { AllowedAuthorizationEntityType } from './interfaces';
import { ReferenceLoader } from './reference.loader';

describe('reference.loader', () => {
	let service: ReferenceLoader;
	let userRepo: DeepMocked<UserRepo>;
	let courseRepo: DeepMocked<CourseRepo>;
	let courseGroupRepo: DeepMocked<CourseGroupRepo>;
	let taskRepo: DeepMocked<TaskRepo>;
	let schoolRepo: DeepMocked<SchoolRepo>;
	let lessonRepo: DeepMocked<LessonRepo>;
	let teamsRepo: DeepMocked<TeamsRepo>;
	let submissionRepo: DeepMocked<SubmissionRepo>;
	let schoolExternalToolRepo: DeepMocked<SchoolExternalToolRepo>;
	let findNodeService: DeepMocked<BoardNodeService>;
	const entityId: EntityId = new ObjectId().toHexString();

	beforeAll(async () => {
		await setupEntities();

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
				{
					provide: SubmissionRepo,
					useValue: createMock<SubmissionRepo>(),
				},
				{
					provide: SchoolExternalToolRepo,
					useValue: createMock<SchoolExternalToolRepo>(),
				},
				{
					provide: BoardNodeService,
					useValue: createMock<BoardNodeService>(),
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
		submissionRepo = await module.get(SubmissionRepo);
		schoolExternalToolRepo = await module.get(SchoolExternalToolRepo);
		findNodeService = await module.get(BoardNodeService);
	});

	afterEach(() => {
		jest.resetAllMocks();
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

		it('should call submissionRepo.findById', async () => {
			await service.loadEntity(AllowedAuthorizationEntityType.Submission, entityId);

			expect(submissionRepo.findById).toBeCalledWith(entityId);
		});

		it('should call schoolExternalToolRepo.findById', async () => {
			await service.loadEntity(AllowedAuthorizationEntityType.SchoolExternalTool, entityId);

			expect(schoolExternalToolRepo.findById).toBeCalledWith(entityId);
		});

		it('should call findNodeService.findById', async () => {
			await service.loadEntity(AllowedAuthorizationEntityType.BoardNode, entityId);

			expect(findNodeService.findById).toBeCalledWith(entityId);
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

	describe('getUserWithPermissions', () => {
		describe('when user successfully', () => {
			const setup = () => {
				const roles = [roleFactory.build()];
				const user = userFactory.buildWithId({ roles });
				userRepo.findById.mockResolvedValue(user);
				return {
					user,
				};
			};

			it('should call userRepo.findById with specific arguments', async () => {
				const { user } = setup();

				await service.getUserWithPermissions(user.id);

				expect(userRepo.findById).toBeCalledWith(user.id, true);
			});

			it('should return user entity', async () => {
				const { user } = setup();

				const result = await service.getUserWithPermissions(user.id);

				expect(result).toBe(user);
			});
		});
	});
});
