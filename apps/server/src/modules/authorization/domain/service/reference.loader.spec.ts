import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { InstanceService } from '@modules/instance';
import { LessonService } from '@modules/lesson';
import { ContextExternalToolAuthorizableService, ExternalToolAuthorizableService } from '@modules/tool';
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
	UserRepo,
} from '@shared/repo';
import { setupEntities, userFactory } from '@shared/testing';
import { TeamAuthorisableService } from '@src/modules/teams';
import { AuthorizableReferenceType } from '../type';
import { ReferenceLoader } from './reference.loader';
import { AuthorizationInjectionService } from './authorization-injection.service';

describe('reference.loader', () => {
	let service: ReferenceLoader;
	let injectionService: DeepMocked<AuthorizationInjectionService>;
	let userRepo: DeepMocked<UserRepo>;
	let courseRepo: DeepMocked<CourseRepo>;
	let courseGroupRepo: DeepMocked<CourseGroupRepo>;
	let taskRepo: DeepMocked<TaskRepo>;
	let schoolRepo: DeepMocked<LegacySchoolRepo>;
	let lessonService: DeepMocked<LessonService>;
	let teamsAuthorisableService: DeepMocked<TeamAuthorisableService>;
	let submissionRepo: DeepMocked<SubmissionRepo>;
	let schoolExternalToolRepo: DeepMocked<SchoolExternalToolRepo>;
	let contextExternalToolAuthorizableService: DeepMocked<ContextExternalToolAuthorizableService>;
	let externalToolAuthorizableService: DeepMocked<ExternalToolAuthorizableService>;
	let instanceService: DeepMocked<InstanceService>;
	const entityId: EntityId = new ObjectId().toHexString();

	beforeAll(async () => {
		await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ReferenceLoader,
				{
					provide: AuthorizationInjectionService,
					useValue: createMock<AuthorizationInjectionService>(),
				},
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
					provide: TeamAuthorisableService,
					useValue: createMock<TeamAuthorisableService>(),
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
					provide: ContextExternalToolAuthorizableService,
					useValue: createMock<ContextExternalToolAuthorizableService>(),
				},
				{
					provide: ExternalToolAuthorizableService,
					useValue: createMock<ExternalToolAuthorizableService>(),
				},
				{
					provide: InstanceService,
					useValue: createMock<InstanceService>(),
				},
			],
		}).compile();

		service = await module.get(ReferenceLoader);
		injectionService = await module.get(AuthorizationInjectionService);
		userRepo = await module.get(UserRepo);
		courseRepo = await module.get(CourseRepo);
		courseGroupRepo = await module.get(CourseGroupRepo);
		taskRepo = await module.get(TaskRepo);
		schoolRepo = await module.get(LegacySchoolRepo);
		lessonService = await module.get(LessonService);
		teamsAuthorisableService = await module.get(TeamAuthorisableService);
		submissionRepo = await module.get(SubmissionRepo);
		schoolExternalToolRepo = await module.get(SchoolExternalToolRepo);
		contextExternalToolAuthorizableService = await module.get(ContextExternalToolAuthorizableService);
		externalToolAuthorizableService = await module.get(ExternalToolAuthorizableService);
		instanceService = await module.get(InstanceService);
	});

	afterEach(() => {
		injectionService.getReferenceLoader.mockReset();
	});

	afterAll(() => {
		jest.resetAllMocks();
	});

	it('should to be defined', () => {
		expect(service).toBeDefined();
	});

	describe('loadEntity', () => {
		it('should call findById on reference loader', async () => {
			const referenceLoader = {
				findById: jest.fn(),
			};

			injectionService.getReferenceLoader.mockReturnValue(referenceLoader);

			await service.loadAuthorizableObject(AuthorizableReferenceType.User, entityId);

			expect(referenceLoader.findById).toBeCalledWith(entityId);
		});

		it('should return authorizable object', async () => {
			const expected = userFactory.build();
			const referenceLoader = {
				findById: jest.fn().mockResolvedValue(expected),
			};

			injectionService.getReferenceLoader.mockReturnValue(referenceLoader);

			const result = await service.loadAuthorizableObject(AuthorizableReferenceType.User, entityId);

			expect(result).toEqual(expected);
		});

		it('should throw on unknown authorization entity type', () => {
			void expect(async () =>
				service.loadAuthorizableObject('NotAllowedEntityType' as AuthorizableReferenceType, entityId)
			).rejects.toThrow(NotImplementedException);
		});
	});

	describe('currently, the reference loader has to inject the loaders into the injection service. In the future, this part should be moved into the modules.', () => {
		it('should inject user repo', () => {
			expect(injectionService.injectReferenceLoader).toBeCalledWith(AuthorizableReferenceType.User, userRepo);
		});

		it('should inject course repo', () => {
			expect(injectionService.injectReferenceLoader).toBeCalledWith(AuthorizableReferenceType.Course, courseRepo);
		});

		it('should inject course group repo', () => {
			expect(injectionService.injectReferenceLoader).toBeCalledWith(
				AuthorizableReferenceType.CourseGroup,
				courseGroupRepo
			);
		});

		it('should inject task repo', () => {
			expect(injectionService.injectReferenceLoader).toBeCalledWith(AuthorizableReferenceType.Task, taskRepo);
		});

		it('should inject school repo', () => {
			expect(injectionService.injectReferenceLoader).toBeCalledWith(AuthorizableReferenceType.School, schoolRepo);
		});

		it('should inject lesson service', () => {
			expect(injectionService.injectReferenceLoader).toBeCalledWith(AuthorizableReferenceType.Lesson, lessonService);
		});

		it('should inject teams repo', () => {
			expect(injectionService.injectReferenceLoader).toBeCalledWith(
				AuthorizableReferenceType.Team,
				teamsAuthorisableService
			);
		});

		it('should inject submission repo', () => {
			expect(injectionService.injectReferenceLoader).toBeCalledWith(
				AuthorizableReferenceType.Submission,
				submissionRepo
			);
		});

		it('should inject school external tool repo', () => {
			expect(injectionService.injectReferenceLoader).toBeCalledWith(
				AuthorizableReferenceType.SchoolExternalToolEntity,
				schoolExternalToolRepo
			);
		});

		it('should inject context external tool authorizable service', () => {
			expect(injectionService.injectReferenceLoader).toBeCalledWith(
				AuthorizableReferenceType.ContextExternalToolEntity,
				contextExternalToolAuthorizableService
			);
		});

		it('should inject external tool authorizable service', () => {
			expect(injectionService.injectReferenceLoader).toBeCalledWith(
				AuthorizableReferenceType.ExternalTool,
				externalToolAuthorizableService
			);
		});

		it('should inject instance service', () => {
			expect(injectionService.injectReferenceLoader).toBeCalledWith(
				AuthorizableReferenceType.Instance,
				instanceService
			);
		});
	});
});
