import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizationService } from '../../authorization/authorization.service';
import { FeathersServiceProvider } from '../../authorization/feathers-service.provider';
import { NewsRepo } from '../repo/news.repo';
import { NewsUc } from './news.uc';

describe('NewsUc', () => {
	let service: NewsUc;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				NewsUc,
				{
					provide: NewsRepo,
					useValue: {},
				},
				AuthorizationService,
				FeathersServiceProvider,
			],
		}).compile();

		service = module.get<NewsUc>(NewsUc);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
