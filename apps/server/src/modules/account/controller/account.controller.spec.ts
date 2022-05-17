import { Test, TestingModule } from '@nestjs/testing';
import { AccountController } from './account.controller';
import { AccountUc } from '../uc/account.uc';

describe('account.controller', () => {
	let module: TestingModule;
	let controller: AccountController;
	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				AccountController,
				{
					provide: AccountUc,
					useValue: {},
				},
			],
		}).compile();
		controller = module.get(AccountController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
