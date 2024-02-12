import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { setupEntities, teamNewsFactory, userFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { NewsRepo } from '@shared/repo';
import { DomainOperationBuilder } from '@shared/domain/builder';
import { DomainName, OperationType } from '@shared/domain/types';
import { NewsService } from './news.service';

describe(NewsService.name, () => {
	let module: TestingModule;
	let service: NewsService;
	let repo: DeepMocked<NewsRepo>;

	beforeAll(async () => {
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
			],
		}).compile();

		service = module.get(NewsService);
		repo = module.get(NewsRepo);

		await setupEntities();
	});

	afterEach(() => {
		repo.findByCreatorOrUpdaterId.mockClear();
		repo.save.mockClear();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('deleteCreatorReference', () => {
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

			const expectedResultWithDeletedCreator = DomainOperationBuilder.build(DomainName.NEWS, OperationType.UPDATE, 2, [
				news1.id,
				news3.id,
			]);

			const expectedResultWithDeletedUpdater = DomainOperationBuilder.build(DomainName.NEWS, OperationType.UPDATE, 2, [
				news2.id,
				news3.id,
			]);

			const expectedResultWithoutUpdatedNews = DomainOperationBuilder.build(
				DomainName.NEWS,
				OperationType.UPDATE,
				0,
				[]
			);

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

		describe('when user is creator of news', () => {
			it('it should be removed from news', async () => {
				const { user1, news1, news3 } = setup();

				repo.findByCreatorOrUpdaterId.mockResolvedValueOnce([[news1, news3], 2]);

				await service.deleteCreatorOrUpdaterReference(user1.id);

				expect(news1.creator).toBeUndefined();
				expect(news3.creator).toBeUndefined();
			});

			it('it should return response for 2 news updated', async () => {
				const { expectedResultWithDeletedCreator, user1, news1, news3 } = setup();

				repo.findByCreatorOrUpdaterId.mockResolvedValueOnce([[news1, news3], 2]);

				const result = await service.deleteCreatorOrUpdaterReference(user1.id);

				expect(result).toEqual(expectedResultWithDeletedCreator);
			});
		});

		describe('when user is updater of news', () => {
			it('user should be removed from updater', async () => {
				const { user2, news2, news3 } = setup();

				repo.findByCreatorOrUpdaterId.mockResolvedValueOnce([[news2, news3], 2]);

				await service.deleteCreatorOrUpdaterReference(user2.id);

				expect(news2.updater).toBeUndefined();
				expect(news3.updater).toBeUndefined();
			});

			it('it should return response for 2 news updated', async () => {
				const { expectedResultWithDeletedUpdater, user2, news2, news3 } = setup();

				repo.findByCreatorOrUpdaterId.mockResolvedValueOnce([[news2, news3], 2]);

				const result = await service.deleteCreatorOrUpdaterReference(user2.id);

				expect(result).toEqual(expectedResultWithDeletedUpdater);
			});
		});

		describe('when user is neither creator nor updater', () => {
			it('should return response with 0 updated news', async () => {
				const { anotherUserId, expectedResultWithoutUpdatedNews } = setup();

				repo.findByCreatorOrUpdaterId.mockResolvedValueOnce([[], 0]);

				const result = await service.deleteCreatorOrUpdaterReference(anotherUserId);

				expect(result).toEqual(expectedResultWithoutUpdatedNews);
			});
		});
	});
});
