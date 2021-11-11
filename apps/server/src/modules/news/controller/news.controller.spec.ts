import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@src/modules/authorization';
import { NewsRepo } from '@shared/repo';
import { NewsController } from './news.controller';
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

		controller = module.get(NewsController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
