import { Test, TestingModule } from '@nestjs/testing';
import { FwuController } from './fwu.controller';
import { FwuUc } from '../uc/fwu.uc';

describe('fwu.controller', () => {
	let module: TestingModule;
	let controller: FwuController;
	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				FwuController,
				{
					provide: FwuUc,
					useValue: {},
				},
			],
		}).compile();
		controller = module.get(FwuController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
