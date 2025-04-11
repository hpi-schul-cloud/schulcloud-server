import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizableReferenceType, AuthorizationInjectionService } from '@modules/authorization';
import { InstanceService } from '@modules/instance';
import { SubmissionRepo, TaskRepo } from '@modules/task/repo';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { NotImplementedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId } from '@shared/domain/types';
import { setupEntities } from '@testing/database';
import { ReferenceLoader } from './reference.loader';

describe('reference.loader', () => {
	let service: ReferenceLoader;
	let injectionService: DeepMocked<AuthorizationInjectionService>;
	let taskRepo: DeepMocked<TaskRepo>;
	let submissionRepo: DeepMocked<SubmissionRepo>;
	let instanceService: DeepMocked<InstanceService>;
	const entityId: EntityId = new ObjectId().toHexString();

	beforeAll(async () => {
		await setupEntities([User]);

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ReferenceLoader,
				{
					provide: AuthorizationInjectionService,
					useValue: createMock<AuthorizationInjectionService>(),
				},
				{
					provide: TaskRepo,
					useValue: createMock<TaskRepo>(),
				},

				{
					provide: SubmissionRepo,
					useValue: createMock<SubmissionRepo>(),
				},
				{
					provide: InstanceService,
					useValue: createMock<InstanceService>(),
				},
			],
		}).compile();

		service = await module.get(ReferenceLoader);
		injectionService = await module.get(AuthorizationInjectionService);
		taskRepo = await module.get(TaskRepo);
		submissionRepo = await module.get(SubmissionRepo);
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

	describe('currently, the reference loader has to inject the loaders into the injection service. In the future, this part should be moved into the modules.', () => {});

	it('should inject task repo', () => {
		expect(injectionService.injectReferenceLoader).toBeCalledWith(AuthorizableReferenceType.Task, taskRepo);
	});

	it('should inject submission repo', () => {
		expect(injectionService.injectReferenceLoader).toBeCalledWith(AuthorizableReferenceType.Submission, submissionRepo);
	});

	it('should inject instance service', () => {
		expect(injectionService.injectReferenceLoader).toBeCalledWith(AuthorizableReferenceType.Instance, instanceService);
	});
});
