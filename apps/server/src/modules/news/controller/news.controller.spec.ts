import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from '@src/core/logger/logger.module';
import { AuthorizationModule } from '@src/modules/authorization/authorization.module';
import { NewsController } from './news.controller';
import { NewsRepo } from '../repo/news.repo';
import { NewsUc } from '../uc';

describe('NewsController', () => {
	let controller: NewsController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [NewsController],
			imports: [LoggerModule, AuthorizationModule],
			providers: [
				NewsUc,
				{
					provide: NewsRepo,
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
