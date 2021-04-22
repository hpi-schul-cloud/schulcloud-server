import { Test, TestingModule } from '@nestjs/testing';
import { NewsService } from './news.service';
import { NewsRepo } from './repos/news.repo';

describe('NewsService', () => {
	let service: NewsService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				NewsService,
				{
					provide: NewsRepo,
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
