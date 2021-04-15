import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { NewsService } from './news.service';
import { NewsRepoService } from './repos/news-repo.service';
import { News } from './repos/schemas/news.schema';

describe('NewsService', () => {
	let service: NewsService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				NewsService,
				NewsRepoService,
				{
					provide: getModelToken(News.name),
					useValue: {},
				},
			],
		}).compile();

		service = module.get<NewsService>(NewsService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
