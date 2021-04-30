import { Test, TestingModule } from '@nestjs/testing';
import { NewsController } from './controller/news.controller';
import { NewsService } from './news.service';
import { NewsRepo } from './repo/news.repo';

describe('NewsController', () => {
	let controller: NewsController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [NewsController],
			providers: [
				NewsService,
				{
					provide: NewsRepo,
					useValue: {},
				},
			],
		}).compile();

		controller = module.get<NewsController>(NewsController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
