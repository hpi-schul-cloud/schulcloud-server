import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { NewsRepo } from './news.repo';

describe('NewsRepoService', () => {
	let service: NewsRepo;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				NewsRepo,
				{
					provide: getModelToken(NewsDocument.name),
					useValue: {},
				},
			],
		}).compile();

		service = module.get<NewsRepo>(NewsRepo);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
