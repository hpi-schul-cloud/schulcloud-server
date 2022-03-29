import { Test, TestingModule } from '@nestjs/testing';
import { ICurrentUser } from '@shared/domain';
import { AccountUc } from '../uc/account.uc';
import { AccountController } from './account.controller';
import { PatchMyAccountParams, PutMyPasswordParams } from './dto';

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
						updateMyAccount: jest.fn(),
						changeMyTemporaryPassword: jest.fn(),
					},
				},
			],
		}).compile();
		accountController = module.get(AccountController);
		accountUc = module.get(AccountUc);
	});

	it('should call change password use case', async () => {
		const currentUser = { userId: 'userId' } as ICurrentUser;
		const testOtherUserId = 'anotherUserId';
		const testPassword = 'newPassword';
		await accountController.changePassword(currentUser, testOtherUserId, { password: testPassword });
		expect(accountUc.changePasswordForUser).toBeCalledWith(currentUser.userId, testOtherUserId, testPassword);
	});

	it('should call update my account use case', async () => {
		const currentUser = { userId: 'userId' } as ICurrentUser;
		const patchMyAccountParams: PatchMyAccountParams = {
			passwordOld: 'passwordOld',
			email: 'email',
			language: 'language',
			firstName: 'firstName',
			lastName: 'lastName',
			passwordNew: 'passwordNew',
		};
		await accountController.updateMyAccount(currentUser, patchMyAccountParams);
		expect(accountUc.updateMyAccount).toBeCalledWith(currentUser.userId, patchMyAccountParams);
	});

	it('should call update my password use case', async () => {
		const currentUser = { userId: 'userId' } as ICurrentUser;
		const putMyPasswordParams: PutMyPasswordParams = {
			password: 'password1',
			confirmPassword: 'password2',
		};
		await accountController.updateMyPassword(currentUser, putMyPasswordParams);
		expect(accountUc.changeMyTemporaryPassword).toBeCalledWith(
			currentUser.userId,
			putMyPasswordParams.password,
			putMyPasswordParams.confirmPassword
		);
	});
});
