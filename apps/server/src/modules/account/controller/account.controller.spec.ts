import { Test, TestingModule } from '@nestjs/testing';
import { AccountUc } from '../uc/account.uc';
import { AccountController } from './account.controller';

// TODO: delete this file
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
