import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { LessonService } from '@modules/lesson';
import { ContextExternalToolAuthorizableService } from '@modules/tool';
import { NotImplementedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId } from '@shared/domain/types';
import {
	CourseGroupRepo,
	CourseRepo,
	LegacySchoolRepo,
	SchoolExternalToolRepo,
	SubmissionRepo,
	TaskRepo,
	TeamsRepo,
	UserRepo,
} from '@shared/repo';
import { setupEntities, userFactory } from '@shared/testing';
import { BoardNodeAuthorizableService } from '@src/modules/board';
import { AuthorizableReferenceType } from '../type';
import { ReferenceLoader } from './reference.loader';

describe('reference.loader', () => {
	let service: ReferenceLoader;
	let userRepo: DeepMocked<UserRepo>;
	let courseRepo: DeepMocked<CourseRepo>;
	let courseGroupRepo: DeepMocked<CourseGroupRepo>;
	let taskRepo: DeepMocked<TaskRepo>;
	let schoolRepo: DeepMocked<LegacySchoolRepo>;
	let lessonService: DeepMocked<LessonService>;
	let teamsRepo: DeepMocked<TeamsRepo>;
	let submissionRepo: DeepMocked<SubmissionRepo>;
	let schoolExternalToolRepo: DeepMocked<SchoolExternalToolRepo>;
	let boardNodeAuthorizableService: DeepMocked<BoardNodeAuthorizableService>;
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
					provide: LessonService,
					useValue: createMock<LessonService>(),
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
					provide: BoardNodeAuthorizableService,
					useValue: createMock<BoardNodeAuthorizableService>(),
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
		lessonService = await module.get(LessonService);
		teamsRepo = await module.get(TeamsRepo);
		submissionRepo = await module.get(SubmissionRepo);
		schoolExternalToolRepo = await module.get(SchoolExternalToolRepo);
		boardNodeAuthorizableService = await module.get(BoardNodeAuthorizableService);
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

			expect(userRepo.findById).toBeCalledWith(entityId);
		});

		it('should call lessonRepo.findById', async () => {
			await service.loadAuthorizableObject(AuthorizableReferenceType.Lesson, entityId);

			expect(lessonService.findById).toBeCalledWith(entityId);
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
});
