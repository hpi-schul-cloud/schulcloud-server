import { Test, TestingModule } from '@nestjs/testing';
import { ICurrentUser } from '@shared/domain';
import { AccountUc } from '../uc/account.uc';
import { AccountController } from './account.controller';

describe('account.controller', () => {
	let module: TestingModule;
	let accountController: AccountController;
	let accountUc: AccountUc;
	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				AccountController,
				{
					provide: AccountUc,
					useValue: {
						changePasswordForUser: jest.fn(),
					},
				},
			],
		}).compile();
		accountController = module.get(AccountController);
		accountUc = module.get(AccountUc);
	});

	it('should call use case', async () => {
		const currentUser = { userId: 'userId' } as ICurrentUser;
		await accountController.changePassword(currentUser, 'anotherUserId', { password: 'newPassword' });
		expect(accountUc.changePasswordForUser).toBeCalledWith('userId', 'anotherUserId', 'newPassword');
	});
});
