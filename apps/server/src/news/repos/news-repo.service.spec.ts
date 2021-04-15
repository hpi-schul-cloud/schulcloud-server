import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { NewsRepoService } from './news-repo.service';
import { News } from './schemas/news.schema';

describe('NewsRepoService', () => {
	let service: NewsRepoService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				NewsRepoService,
				{
					provide: getModelToken(News.name),
					useValue: {},
				},
			],
		}).compile();

		service = module.get<NewsRepoService>(NewsRepoService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
