import { Test, TestingModule } from '@nestjs/testing';
import { NewsController } from './news.controller';
import { NewsService } from '../news.service';
import { NewsRepo } from '../repo/news.repo';
import { AuthorizationService } from '../../authorization/authorization.service';
import { FeathersServiceProvider } from '../../authorization/feathers-service.provider';

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
				AuthorizationService,
				FeathersServiceProvider,
			],
		}).compile();

		controller = module.get<NewsController>(NewsController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
