import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import {
	DataDeletedEvent,
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
} from '@modules/deletion';
import { deletionRequestFactory } from '@modules/deletion/domain/testing';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { NewsRepo } from '@shared/repo';
import { setupEntities, teamNewsFactory, userFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { NewsService } from './news.service';

describe(NewsService.name, () => {
	let module: TestingModule;
	let service: NewsService;
	let repo: DeepMocked<NewsRepo>;
	let eventBus: DeepMocked<EventBus>;

	beforeAll(async () => {
		const orm = await setupEntities();

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
					provide: EventBus,
					useValue: {
						publish: jest.fn(),
					},
				},
				{
					provide: MikroORM,
					useValue: orm,
				},
			],
		}).compile();

		service = module.get(NewsService);
		repo = module.get(NewsRepo);
		eventBus = module.get(EventBus);
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

			const expectedResultWithDeletedCreator = DomainDeletionReportBuilder.build(DomainName.NEWS, [
				DomainOperationReportBuilder.build(OperationType.UPDATE, 2, [news1.id, news3.id]),
			]);

			const expectedResultWithDeletedUpdater = DomainDeletionReportBuilder.build(DomainName.NEWS, [
				DomainOperationReportBuilder.build(OperationType.UPDATE, 2, [news2.id, news3.id]),
			]);

			const expectedResultWithoutUpdatedNews = DomainDeletionReportBuilder.build(DomainName.NEWS, [
				DomainOperationReportBuilder.build(OperationType.UPDATE, 0, []),
			]);

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

				await service.deleteUserData(user1.id);

				expect(news1.creator).toBeUndefined();
				expect(news3.creator).toBeUndefined();
			});

			it('it should return response for 2 news updated', async () => {
				const { expectedResultWithDeletedCreator, user1, news1, news3 } = setup();

				repo.findByCreatorOrUpdaterId.mockResolvedValueOnce([[news1, news3], 2]);

				const result = await service.deleteUserData(user1.id);

				expect(result).toEqual(expectedResultWithDeletedCreator);
			});
		});

		describe('when user is updater of news', () => {
			it('user should be removed from updater', async () => {
				const { user2, news2, news3 } = setup();

				repo.findByCreatorOrUpdaterId.mockResolvedValueOnce([[news2, news3], 2]);

				await service.deleteUserData(user2.id);

				expect(news2.updater).toBeUndefined();
				expect(news3.updater).toBeUndefined();
			});

			it('it should return response for 2 news updated', async () => {
				const { expectedResultWithDeletedUpdater, user2, news2, news3 } = setup();

				repo.findByCreatorOrUpdaterId.mockResolvedValueOnce([[news2, news3], 2]);

				const result = await service.deleteUserData(user2.id);

				expect(result).toEqual(expectedResultWithDeletedUpdater);
			});
		});

		describe('when user is neither creator nor updater', () => {
			it('should return response with 0 updated news', async () => {
				const { anotherUserId, expectedResultWithoutUpdatedNews } = setup();

				repo.findByCreatorOrUpdaterId.mockResolvedValueOnce([[], 0]);

				const result = await service.deleteUserData(anotherUserId);

				expect(result).toEqual(expectedResultWithoutUpdatedNews);
			});
		});
	});

	describe('handle', () => {
		const setup = () => {
			const targetRefId = new ObjectId().toHexString();
			const targetRefDomain = DomainName.FILERECORDS;
			const deletionRequest = deletionRequestFactory.build({ targetRefId, targetRefDomain });
			const deletionRequestId = deletionRequest.id;

			const expectedData = DomainDeletionReportBuilder.build(DomainName.FILERECORDS, [
				DomainOperationReportBuilder.build(OperationType.UPDATE, 2, [
					new ObjectId().toHexString(),
					new ObjectId().toHexString(),
				]),
			]);

			return {
				deletionRequestId,
				expectedData,
				targetRefId,
			};
		};

		describe('when UserDeletedEvent is received', () => {
			it('should call deleteUserData in classService', async () => {
				const { deletionRequestId, expectedData, targetRefId } = setup();

				jest.spyOn(service, 'deleteUserData').mockResolvedValueOnce(expectedData);

				await service.handle({ deletionRequestId, targetRefId });

				expect(service.deleteUserData).toHaveBeenCalledWith(targetRefId);
			});

			it('should call eventBus.publish with DataDeletedEvent', async () => {
				const { deletionRequestId, expectedData, targetRefId } = setup();

				jest.spyOn(service, 'deleteUserData').mockResolvedValueOnce(expectedData);

				await service.handle({ deletionRequestId, targetRefId });

				expect(eventBus.publish).toHaveBeenCalledWith(new DataDeletedEvent(deletionRequestId, expectedData));
			});
		});
	});
});
