import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';
import { NewsRepoService } from './repos/news-repo.service';
import { NewsSchema } from './repos/schemas/news.schema';

describe('NewsController', () => {
	let controller: NewsController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [NewsController],
			providers: [
				NewsService,
				NewsRepoService,
				{
					provide: getModelToken(News.name),
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
