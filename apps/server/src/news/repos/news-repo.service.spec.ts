import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { NewsDocument } from '../interfaces/news.interface';
import { NewsRepoService } from './news-repo.service';

describe('NewsRepoService', () => {
	let service: NewsRepoService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				NewsRepoService,
				{
					provide: getModelToken(NewsDocument.name),
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
