import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { createMock } from '@golevelup/ts-jest';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { AccountRepo } from '@shared/repo';
import { AccountDto, AccountSaveDto } from '@src/modules/account/services/dto';
import { IdentityManagementModule } from '@shared/infra/identity-management';
import { Logger } from '@src/core/logger';
import { IAccount } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import { AccountService } from './account.service';
import { IdentityManagementService } from '../../../shared/infra/identity-management/identity-management.service';

describe.skip('AccountService Integration', () => {
	let module: TestingModule;
	let accountService: AccountService;
	let idmService: IdentityManagementService;
	let account: AccountDto;

	const testAccount: AccountSaveDto = {
		username: 'john.doe@mail.tld',
		userId: new ObjectId().toString(),
		password: 'password',
	};
	const createAccount = async (): Promise<AccountDto> => {
		const temp = await idmService.findAccountByUsername(testAccount.username);
		if (temp) {
			await accountService.delete(temp.id as string);
		}
		return accountService.save(testAccount);
	};
	const deleteAccount = async (username: string): Promise<void> => {
		const temp = await idmService.findAccountByUsername(username);
		if (temp) {
			await accountService.delete(temp.id as string);
		}
	};

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				ConfigModule.forRoot({
					isGlobal: true,
					ignoreEnvFile: true,
					ignoreEnvVars: true,
					load: [
						() => ({
							FEATURE_KEYCLOAK_IDENTITY_STORE_ENABLED: true,
						}),
					],
				}),
				MongoMemoryDatabaseModule.forRoot(),
				IdentityManagementModule,
			],
			providers: [
				AccountRepo,
				AccountService,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();
		accountService = module.get(AccountService);
		idmService = module.get(IdentityManagementService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(async () => {
		account = await createAccount();
	});

	afterEach(async () => {
		await deleteAccount(account.id);
	});

	describe('should mirror create, update and delete operations into the IDM', () => {
		it('save should create a new account', async () => {
			const accounts = await idmService.getAllAccounts();

			expect(accounts).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						userName: testAccount.username,
					}),
				])
			);
		});

		it.skip('save should update existing account', async () => {
			const newUserName = 'jane.doe@mail.tld';
			const accountToUpdate = await createAccount();
			await accountService.save({
				username: newUserName,
			});
			const accounts = await idmService.getAllAccounts();

			expect(accounts).not.toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						userName: testAccount.username,
					}),
				])
			);
		});

		it.skip('updateUsername should update user name', async () => {});

		it.skip('updatePassword should update password', async () => {
			await expect(accountService.updatePassword(account.id, 'newPassword')).resolves.not.toThrow();
			await deleteAccount(account.id);
		});

		it('delete should remove account', async () => {
			await accountService.delete(account.id);
			const accounts = await idmService.getAllAccounts();

			expect(accounts).not.toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						userName: testAccount.username,
					}),
				])
			);
		});

		it('deleteByUserId should remove account', async () => {
			await accountService.deleteByUserId(account.userId as string);
			const accounts = await idmService.getAllAccounts();

			expect(accounts).not.toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						userName: testAccount.username,
					}),
				])
			);
		});
	});
});
