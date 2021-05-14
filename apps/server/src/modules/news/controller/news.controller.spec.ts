import { Test, TestingModule } from '@nestjs/testing';
import { NewsController } from './news.controller';
import { NewsRepo } from '../repo/news.repo';
import { AuthorizationService } from '../../authorization/authorization.service';
import { FeathersServiceProvider } from '../../authorization/feathers-service.provider';
import { NewsUc } from '../uc';

describe('NewsController', () => {
	let controller: NewsController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [NewsController],
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

		controller = module.get<NewsController>(NewsController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
