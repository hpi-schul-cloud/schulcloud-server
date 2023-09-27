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
	LegacySchoolRepo,
	SubmissionRepo,
	TaskRepo,
	TeamsRepo,
	UserRepo,
} from '@shared/repo';
import { roleFactory, setupEntities, userFactory } from '@shared/testing';
import { BoardDoAuthorizableService } from '@src/modules/board';
import { ContextExternalToolAuthorizableService } from '@src/modules/tool/context-external-tool/service/context-external-tool-authorizable.service';
import { ReferenceLoader } from './reference.loader';
import { AuthorizableReferenceType } from './types';

describe('reference.loader', () => {
	let service: ReferenceLoader;
	let userRepo: DeepMocked<UserRepo>;
	let courseRepo: DeepMocked<CourseRepo>;
	let courseGroupRepo: DeepMocked<CourseGroupRepo>;
	let taskRepo: DeepMocked<TaskRepo>;
	let schoolRepo: DeepMocked<LegacySchoolRepo>;
	let lessonRepo: DeepMocked<LessonRepo>;
	let teamsRepo: DeepMocked<TeamsRepo>;
	let submissionRepo: DeepMocked<SubmissionRepo>;
	let schoolExternalToolRepo: DeepMocked<SchoolExternalToolRepo>;
	let boardNodeAuthorizableService: DeepMocked<BoardDoAuthorizableService>;
	let contextExternalToolAuthorizableService: DeepMocked<ContextExternalToolAuthorizableService>;
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
					provide: LegacySchoolRepo,
					useValue: createMock<LegacySchoolRepo>(),
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
					provide: BoardDoAuthorizableService,
					useValue: createMock<BoardDoAuthorizableService>(),
				},
				{
					provide: ContextExternalToolAuthorizableService,
					useValue: createMock<ContextExternalToolAuthorizableService>(),
				},
			],
		}).compile();

		service = await module.get(ReferenceLoader);
		userRepo = await module.get(UserRepo);
		courseRepo = await module.get(CourseRepo);
		courseGroupRepo = await module.get(CourseGroupRepo);
		taskRepo = await module.get(TaskRepo);
		schoolRepo = await module.get(LegacySchoolRepo);
		lessonRepo = await module.get(LessonRepo);
		teamsRepo = await module.get(TeamsRepo);
		submissionRepo = await module.get(SubmissionRepo);
		schoolExternalToolRepo = await module.get(SchoolExternalToolRepo);
		boardNodeAuthorizableService = await module.get(BoardDoAuthorizableService);
		contextExternalToolAuthorizableService = await module.get(ContextExternalToolAuthorizableService);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should to be defined', () => {
		expect(service).toBeDefined();
	});

	describe('loadEntity', () => {
		it('should call taskRepo.findById', async () => {
			await service.loadAuthorizableObject(AuthorizableReferenceType.Task, entityId);

			expect(taskRepo.findById).toBeCalledWith(entityId);
		});

		it('should call courseRepo.findById', async () => {
			await service.loadAuthorizableObject(AuthorizableReferenceType.Course, entityId);

			expect(courseRepo.findById).toBeCalledWith(entityId);
		});

		it('should call courseGroupRepo.findById', async () => {
			await service.loadAuthorizableObject(AuthorizableReferenceType.CourseGroup, entityId);

			expect(courseGroupRepo.findById).toBeCalledWith(entityId);
		});

		it('should call schoolRepo.findById', async () => {
			await service.loadAuthorizableObject(AuthorizableReferenceType.School, entityId);

			expect(schoolRepo.findById).toBeCalledWith(entityId);
		});

		it('should call userRepo.findById', async () => {
			await service.loadAuthorizableObject(AuthorizableReferenceType.User, entityId);

			expect(userRepo.findById).toBeCalledWith(entityId, true);
		});

		it('should call lessonRepo.findById', async () => {
			await service.loadAuthorizableObject(AuthorizableReferenceType.Lesson, entityId);

			expect(lessonRepo.findById).toBeCalledWith(entityId);
		});

		it('should call teamsRepo.findById', async () => {
			await service.loadAuthorizableObject(AuthorizableReferenceType.Team, entityId);

			expect(teamsRepo.findById).toBeCalledWith(entityId, true);
		});

		it('should call contextExternalToolService.findById', async () => {
			await service.loadAuthorizableObject(AuthorizableReferenceType.ContextExternalToolEntity, entityId);

			expect(contextExternalToolAuthorizableService.findById).toBeCalledWith(entityId);
		});

		it('should call submissionRepo.findById', async () => {
			await service.loadAuthorizableObject(AuthorizableReferenceType.Submission, entityId);

			expect(submissionRepo.findById).toBeCalledWith(entityId);
		});

		it('should call schoolExternalToolRepo.findById', async () => {
			await service.loadAuthorizableObject(AuthorizableReferenceType.SchoolExternalToolEntity, entityId);

			expect(schoolExternalToolRepo.findById).toBeCalledWith(entityId);
		});

		it('should call findNodeService.findById', async () => {
			await service.loadAuthorizableObject(AuthorizableReferenceType.BoardNode, entityId);

			expect(boardNodeAuthorizableService.findById).toBeCalledWith(entityId);
		});

		it('should return authorizable object', async () => {
			const user = userFactory.build();
			userRepo.findById.mockResolvedValue(user);

			const result = await service.loadAuthorizableObject(AuthorizableReferenceType.User, entityId);

			expect(result).toBe(user);
		});

		it('should throw on unknown authorization entity type', () => {
			void expect(async () =>
				service.loadAuthorizableObject('NotAllowedEntityType' as AuthorizableReferenceType, entityId)
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

			it('should return user', async () => {
				const { user } = setup();

				const result = await service.getUserWithPermissions(user.id);

				expect(result).toBe(user);
			});
		});
	});
});
