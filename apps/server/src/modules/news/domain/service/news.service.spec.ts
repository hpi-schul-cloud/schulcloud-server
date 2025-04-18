import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import {
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
	UserDeletionInjectionService,
} from '@modules/deletion';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { NewsRepo } from '../../repo';
import { teamNewsFactory } from '../../testing';
import { NewsService } from './news.service';

describe(NewsService.name, () => {
	let module: TestingModule;
	let service: NewsService;
	let repo: DeepMocked<NewsRepo>;

	beforeAll(async () => {
		await setupEntities([User]);

		module = await Test.createTestingModule({
			providers: [
				NewsService,
				{
					provide: NewsRepo,
					useValue: createMock<NewsRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: UserDeletionInjectionService,
					useValue: createMock<UserDeletionInjectionService>({
						injectUserDeletionService: jest.fn(),
					}),
				},
			],
		}).compile();

		service = module.get(NewsService);
		repo = module.get(NewsRepo);
	});

	afterEach(() => {
		repo.findByCreatorOrUpdaterId.mockClear();
		repo.save.mockClear();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('deleteUserData', () => {
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

				const expectedResultWithDeletedCreator = DomainDeletionReportBuilder.build(DomainName.NEWS, [
					DomainOperationReportBuilder.build(OperationType.UPDATE, 2, [news1.id, news3.id]),
				]);

				const expectedResultWithDeletedUpdater = DomainDeletionReportBuilder.build(DomainName.NEWS, [
					DomainOperationReportBuilder.build(OperationType.UPDATE, 2, [news2.id, news3.id]),
				]);

				const expectedResultWithoutUpdatedNews = DomainDeletionReportBuilder.build(DomainName.NEWS, [
					DomainOperationReportBuilder.build(OperationType.UPDATE, 0, []),
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

				await service.deleteUserData(user1.id);

				expect(repo.findByCreatorOrUpdaterId).toHaveBeenCalledWith(user1.id);
			});

			it('should call removeUserReference', async () => {
				const { user1 } = setup();

				await service.deleteUserData(user1.id);

				expect(repo.removeUserReference).toHaveBeenCalledWith(user1.id);
			});

			it('should return DomainDeletionReport', async () => {
				const { expectedResultWithDeletedCreator, user1 } = setup();

				const result = await service.deleteUserData(user1.id);

				expect(result).toEqual(expectedResultWithDeletedCreator);
			});
		});

		describe('when user is neither creator nor updater', () => {
			const setup = () => {
				const anotherUserId = new ObjectId().toHexString();
				const expectedResultWithoutUpdatedNews = DomainDeletionReportBuilder.build(DomainName.NEWS, [
					DomainOperationReportBuilder.build(OperationType.UPDATE, 0, []),
				]);

				repo.findByCreatorOrUpdaterId.mockResolvedValueOnce([[], 0]);

				return {
					anotherUserId,
					expectedResultWithoutUpdatedNews,
				};
			};

			it('should return response with 0 updated news', async () => {
				const { anotherUserId, expectedResultWithoutUpdatedNews } = setup();

				const result = await service.deleteUserData(anotherUserId);

				expect(result).toEqual(expectedResultWithoutUpdatedNews);
			});
		});
	});
});
