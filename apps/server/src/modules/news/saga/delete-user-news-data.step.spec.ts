import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import {
	ModuleName,
	SagaService,
	StepOperationReportBuilder,
	StepOperationType,
	StepReportBuilder,
} from '@modules/saga';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { NewsRepo } from '../repo';
import { teamNewsFactory } from '../testing';
import { DeleteUserNewsDataStep } from './delete-user-news-data.step';

describe(DeleteUserNewsDataStep.name, () => {
	let module: TestingModule;
	let step: DeleteUserNewsDataStep;
	let repo: DeepMocked<NewsRepo>;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		await setupEntities([User]);

		module = await Test.createTestingModule({
			providers: [
				DeleteUserNewsDataStep,
				{
					provide: SagaService,
					useValue: createMock<SagaService>(),
				},
				{
					provide: NewsRepo,
					useValue: createMock<NewsRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		step = module.get(DeleteUserNewsDataStep);
		repo = module.get(NewsRepo);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('step registration', () => {
		it('should register the step with the saga service', () => {
			const sagaService = createMock<SagaService>();
			const step = new DeleteUserNewsDataStep(sagaService, createMock<NewsRepo>(), createMock<Logger>());

			expect(sagaService.registerStep).toHaveBeenCalledWith(ModuleName.NEWS, step);
		});
	});

	describe('execute', () => {
		describe('when user is creator or updater of news', () => {
			const setup = () => {
				const user1 = userFactory.build();
				const user2 = userFactory.build();
				const anotherUserId = new ObjectId().toHexString();

				const news1 = teamNewsFactory.buildWithId({
					creator: user1,
				});
				const news2 = teamNewsFactory.buildWithId({
					updater: user2,
				});
				const news3 = teamNewsFactory.buildWithId({
					creator: user1,
					updater: user2,
				});

				const expectedResultWithDeletedCreator = StepReportBuilder.build(ModuleName.NEWS, [
					StepOperationReportBuilder.build(StepOperationType.UPDATE, 2, [news1.id, news3.id]),
				]);

				const expectedResultWithDeletedUpdater = StepReportBuilder.build(ModuleName.NEWS, [
					StepOperationReportBuilder.build(StepOperationType.UPDATE, 2, [news2.id, news3.id]),
				]);

				const expectedResultWithoutUpdatedNews = StepReportBuilder.build(ModuleName.NEWS, [
					StepOperationReportBuilder.build(StepOperationType.UPDATE, 0, []),
				]);

				repo.findByCreatorOrUpdaterId.mockResolvedValueOnce([[news1, news3], 2]);
				repo.removeUserReference.mockResolvedValueOnce([2, 1]);

				return {
					anotherUserId,
					expectedResultWithDeletedCreator,
					expectedResultWithDeletedUpdater,
					expectedResultWithoutUpdatedNews,
					user1,
					user2,
					news1,
					news2,
					news3,
				};
			};

			it('should call findByCreatorOrUpdaterId', async () => {
				const { user1 } = setup();

				await step.execute({ userId: user1.id });

				expect(repo.findByCreatorOrUpdaterId).toHaveBeenCalledWith(user1.id);
			});

			it('should call removeUserReference', async () => {
				const { user1 } = setup();

				await step.execute({ userId: user1.id });

				expect(repo.removeUserReference).toHaveBeenCalledWith(user1.id);
			});

			it('should return DomainDeletionReport', async () => {
				const { expectedResultWithDeletedCreator, user1 } = setup();

				const result = await step.execute({ userId: user1.id });

				expect(result).toEqual(expectedResultWithDeletedCreator);
			});
		});

		describe('when user is neither creator nor updater', () => {
			const setup = () => {
				const anotherUserId = new ObjectId().toHexString();
				const expectedResultWithoutUpdatedNews = StepReportBuilder.build(ModuleName.NEWS, [
					StepOperationReportBuilder.build(StepOperationType.UPDATE, 0, []),
				]);

				repo.findByCreatorOrUpdaterId.mockResolvedValueOnce([[], 0]);

				return {
					anotherUserId,
					expectedResultWithoutUpdatedNews,
				};
			};

			it('should return response with 0 updated news', async () => {
				const { anotherUserId, expectedResultWithoutUpdatedNews } = setup();

				const result = await step.execute({ userId: anotherUserId });

				expect(result).toEqual(expectedResultWithoutUpdatedNews);
			});
		});
	});
});
