import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizationService } from '../authorization/authorization.service';
import { FeathersServiceProvider } from '../authorization/feathers-service.provider';
import { NewsService } from './news.service';
import { NewsRepo } from './repo/news.repo';

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
				AuthorizationService,
				FeathersServiceProvider,
			],
		}).compile();

		service = module.get<NewsService>(NewsService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
