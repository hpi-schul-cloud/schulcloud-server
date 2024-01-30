import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { setupEntities, teamNewsFactory, userFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { NewsRepo } from '@shared/repo';
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
			const user = userFactory.build();
			const user2 = userFactory.build();

			const news1 = teamNewsFactory.build({
				creator: user,
				updater: user,
			});
			const news2 = teamNewsFactory.build({
				creator: user,
				updater: user2,
			});
			const news3 = teamNewsFactory.build({
				creator: user2,
				updater: user,
			});

			return { user, news1, news2, news3 };
		};
		it('should successfully delete creator or updater reference from news', async () => {
			const { user, news1, news2, news3 } = setup();
			repo.findByCreatorOrUpdaterId.mockResolvedValueOnce([[news1, news2, news3], 3]);
			const result = await service.deleteCreatorOrUpdaterReference(user.id);
			expect(news1.creator).toBeUndefined();
			expect(news1.updater).toBeUndefined();
			expect(news2.creator).toBeUndefined();
			expect(news3.updater).toBeUndefined();
			expect(result).toBe(3);
		});

		it('should return 0 if news not found', async () => {
			const anotherUser = new ObjectId().toHexString();
			repo.findByCreatorOrUpdaterId.mockResolvedValueOnce([[], 0]);
			const result = await service.deleteCreatorOrUpdaterReference(anotherUser);
			expect(result).toBe(0);
		});
	});
});
