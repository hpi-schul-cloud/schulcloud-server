import { createMock, DeepMocked } from '@golevelup/ts-jest';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client-cjs/keycloak-admin-client-cjs-index';
import { Users } from '@keycloak/keycloak-admin-client/lib/resources/users';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityNotFoundError } from '@shared/common';
import { IAccount } from '@shared/domain/interface/account';
import { IdentityManagementService } from '../../identity-management.service';
import { KeycloakSettings } from '../../keycloak-administration/interface/keycloak-settings.interface';
import { KeycloakAdministrationService } from '../../keycloak-administration/service/keycloak-administration.service';
import { KeycloakIdentityManagementService } from './keycloak-identity-management.service';

describe('KeycloakIdentityManagementService', () => {
	let module: TestingModule;
	let idm: IdentityManagementService;
	let kcUsersMock: DeepMocked<Users>;

	type MockUser = {
		id: string;
		username: string;
		email?: string;
		firstName?: string;
		lastName?: string;
	};

	const mockedAdminAccount: MockUser = {
		id: '000',
		username: 'admin',
	};

	const mockedAccount1: MockUser = {
		id: 'user-1-id',
		username: 'user-1',
		email: 'user@mail',
		firstName: 'user',
		lastName: '1',
	};

	const mockedAccount2: MockUser = {
		id: 'user-2-id',
		username: 'user-2',
		email: 'another@mail',
		firstName: 'other',
		lastName: '2',
	};

	beforeEach(async () => {
		kcUsersMock = createMock<Users>();
		module = await Test.createTestingModule({
			providers: [
				KeycloakAdministrationService,
				{ provide: IdentityManagementService, useClass: KeycloakIdentityManagementService },
				{
					provide: KeycloakAdminClient,
					useValue: createMock<KeycloakAdminClient>({
						users: kcUsersMock,
					}),
				},
				{
					provide: KeycloakSettings,
					useValue: {
						credentials: {
							username: mockedAdminAccount.username,
						},
					},
				},
			],
		}).compile();
		idm = module.get<IdentityManagementService>(IdentityManagementService);
	});

	afterEach(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(idm).toBeDefined();
	});

	describe('createAccount', () => {
		it('should allow to create an account', async () => {
			kcUsersMock.find.mockResolvedValueOnce([]);
			const accountId = 'user-1-id';
			const createUserMock = kcUsersMock.create.mockResolvedValueOnce({ id: accountId });
			const resetPasswordMock = kcUsersMock.resetPassword.mockResolvedValueOnce();
			const testAccount = { username: 'test', email: 'test@test.test' };
			const testAccountPassword = 'test';

			const ret = await idm.createAccount(testAccount, testAccountPassword);

			expect(ret).not.toBeNull();
			expect(ret).toBe(accountId);
			expect(createUserMock).toBeCalledWith(
				expect.objectContaining({ username: testAccount.username, email: testAccount.email })
			);
			expect(resetPasswordMock).toBeCalledWith(
				expect.objectContaining({
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					credential: expect.objectContaining({ value: testAccountPassword }),
				})
			);
		});

		it('should enable accounts by default', async () => {
			kcUsersMock.find.mockResolvedValueOnce([]);
			const accountId = 'user-1-id';
			const createUserMock = kcUsersMock.create.mockResolvedValueOnce({ id: accountId });
			kcUsersMock.resetPassword.mockResolvedValueOnce();
			const testAccount = { username: 'test', email: 'test@test.test' };
			const testAccountPassword = 'test';

			const ret = await idm.createAccount(testAccount, testAccountPassword);

			expect(ret).not.toBeNull();
			expect(ret).toBe(accountId);
			expect(createUserMock).toBeCalledWith(expect.objectContaining({ enabled: true }));
		});

		it('should reject if account create fails', async () => {
			kcUsersMock.find.mockResolvedValueOnce([]);
			kcUsersMock.create.mockResolvedValueOnce({ id: 'accountId' });
			kcUsersMock.resetPassword.mockRejectedValueOnce('error');
			kcUsersMock.del.mockResolvedValueOnce();

			const testAccount = { username: 'test', email: 'test@test.test' };
			const testAccountPassword = 'test';

			await expect(idm.createAccount(testAccount, testAccountPassword)).rejects.toBeTruthy();
			expect(kcUsersMock.resetPassword).toHaveBeenCalled();
			expect(kcUsersMock.del).toHaveBeenCalled();
		});
	});

	describe('findAccountById', () => {
		it('should find an existing account', async () => {
			kcUsersMock.find.mockResolvedValueOnce([]);
			kcUsersMock.findOne.mockResolvedValueOnce(mockedAccount1);

			const ret = await idm.findAccountById(mockedAccount1.id);

			expect(ret).not.toBeNull();
			expect(ret).toEqual(
				expect.objectContaining({
					id: mockedAccount1.id,
					username: mockedAccount1.username,
					email: mockedAccount1.email,
					firstName: mockedAccount1.firstName,
					lastName: mockedAccount1.lastName,
				})
			);
		});

		it('should ignore missing id', async () => {
			kcUsersMock.find.mockResolvedValueOnce([]);
			kcUsersMock.findOne.mockResolvedValueOnce({
				...mockedAccount1,
				id: undefined,
			});

			const ret = await idm.findAccountById(mockedAccount1.id);
			expect(ret).not.toBeNull();
			expect(ret).toEqual(
				expect.objectContaining<IAccount>({
					id: '',
				})
			);
		});

		it('should extract given date from keycloak representation', async () => {
			kcUsersMock.find.mockResolvedValueOnce([]);
			// 1647262955423 -> Mon Mar 14 2022 14:02:35 GMT+0100
			const date = new Date();
			const nowUtc = Date.UTC(
				date.getUTCFullYear(),
				date.getUTCMonth(),
				date.getUTCDate(),
				date.getUTCHours(),
				date.getUTCMinutes(),
				date.getUTCSeconds(),
				date.getUTCMilliseconds()
			);

			kcUsersMock.findOne.mockResolvedValueOnce({
				...mockedAccount1,
				createdTimestamp: nowUtc,
			});

			const ret = await idm.findAccountById(mockedAccount1.id);

			expect(ret).not.toBeNull();
			expect(ret).toEqual(
				expect.objectContaining<IAccount>({
					id: ret.id,
					createdDate: date,
				})
			);
		});

		it('should extract attributes from keycloak representation', async () => {
			kcUsersMock.find.mockResolvedValueOnce([]);
			// 1577836861 -> Wed Jan 01 2020 00:01:01 GMT+0000
			kcUsersMock.findOne.mockResolvedValueOnce({
				...mockedAccount1,
				attributes: {
					refTechnicalId: 'tecId',
					refFunctionalIntId: 'fctIntId',
					refFunctionalExtId: 'fctExtId',
				},
			});

			const ret = await idm.findAccountById(mockedAccount1.id);
			expect(ret).not.toBeNull();
			expect(ret).toEqual(
				expect.objectContaining<IAccount>({
					id: ret.id,
					attRefTechnicalId: 'tecId',
					attRefFunctionalIntId: 'fctIntId',
					attRefFunctionalExtId: 'fctExtId',
				})
			);
		});

		it('should extract array attributes from keycloak representation', async () => {
			kcUsersMock.find.mockResolvedValueOnce([]);
			// 1577836861 -> Wed Jan 01 2020 00:01:01 GMT+0000
			kcUsersMock.findOne.mockResolvedValueOnce({
				...mockedAccount1,
				attributes: {
					refTechnicalId: ['tecId', 'ignore'],
					refFunctionalIntId: ['fctIntId', 'ignore', 'ignore'],
					refFunctionalExtId: ['fctExtId'],
				},
			});

			const ret = await idm.findAccountById(mockedAccount1.id);
			expect(ret).not.toBeNull();
			expect(ret).toEqual(
				expect.objectContaining<IAccount>({
					id: ret.id,
					attRefTechnicalId: 'tecId',
					attRefFunctionalIntId: 'fctIntId',
					attRefFunctionalExtId: 'fctExtId',
				})
			);
		});

		it('should reject if account does not exist', async () => {
			kcUsersMock.findOne.mockRejectedValueOnce('error');
			await expect(idm.findAccountById('accountId')).rejects.toBeTruthy();

			kcUsersMock.findOne.mockResolvedValueOnce(undefined);
			await expect(idm.findAccountById('accountId')).rejects.toBeTruthy();
		});
	});

	describe('findAccountByUsername', () => {
		it('should find an existing account by username', async () => {
			kcUsersMock.find.mockResolvedValueOnce([mockedAccount1]);
			const [ret] = await idm.findAccountsByUsername(mockedAccount1.username);

			expect(ret).not.toBeNull();
			expect(ret).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						id: mockedAccount1.id,
						username: mockedAccount1.username,
						email: mockedAccount1.email,
						firstName: mockedAccount1.firstName,
						lastName: mockedAccount1.lastName,
					}),
				])
			);
		});
		it('should return undefined if no account found', async () => {
			kcUsersMock.find.mockResolvedValueOnce([]);
			const [ret] = await idm.findAccountsByUsername('');

			expect(ret).toStrictEqual([]);
		});
	});

	describe('findAccountByTecRefId', () => {
		it('should find an existing account by technical reference id', async () => {
			kcUsersMock.find.mockResolvedValueOnce([mockedAccount1]);
			const ret = await idm.findAccountByTecRefId('any');

			expect(ret).not.toBeNull();
			expect(ret).toEqual(
				expect.objectContaining({
					id: mockedAccount1.id,
					username: mockedAccount1.username,
					email: mockedAccount1.email,
					firstName: mockedAccount1.firstName,
					lastName: mockedAccount1.lastName,
				})
			);
		});
		it('should throw if no account found', async () => {
			kcUsersMock.find.mockResolvedValueOnce([]);
			await expect(idm.findAccountByTecRefId('any')).rejects.toThrow();
		});
		it('should throw if multiple accounts found', async () => {
			kcUsersMock.find.mockResolvedValueOnce([mockedAccount1, mockedAccount2]);
			await expect(idm.findAccountByTecRefId('any')).rejects.toThrow();
		});
	});

	describe('findAccountByTecRefId', () => {
		it('should find an existing account by technical reference id', async () => {
			kcUsersMock.find.mockResolvedValueOnce([mockedAccount1]);
			const ret = await idm.findAccountByFctIntId('any');

			expect(ret).not.toBeNull();
			expect(ret).toEqual(
				expect.objectContaining({
					id: mockedAccount1.id,
					username: mockedAccount1.username,
					email: mockedAccount1.email,
					firstName: mockedAccount1.firstName,
					lastName: mockedAccount1.lastName,
				})
			);
		});
		it('should throw if no account found', async () => {
			kcUsersMock.find.mockResolvedValueOnce([]);
			await expect(idm.findAccountByFctIntId('any')).rejects.toThrow();
		});
		it('should throw if multiple accounts found', async () => {
			kcUsersMock.find.mockResolvedValueOnce([mockedAccount1, mockedAccount2]);
			await expect(idm.findAccountByFctIntId('any')).rejects.toThrow();
		});
	});

	describe('getAllAccounts', () => {
		it('should find all existing accounts', async () => {
			kcUsersMock.find.mockResolvedValueOnce([mockedAccount1, mockedAccount2]);

			const ret = await idm.getAllAccounts();

			expect(ret).not.toBeNull();
			expect(ret).toHaveLength(2);
			expect(ret).toContainEqual(
				expect.objectContaining({
					id: mockedAccount1.id,
					username: mockedAccount1.username,
					email: mockedAccount1.email,
					firstName: mockedAccount1.firstName,
					lastName: mockedAccount1.lastName,
				})
			);
			expect(ret).toContainEqual(
				expect.objectContaining({
					id: mockedAccount2.id,
					username: mockedAccount2.username,
					email: mockedAccount2.email,
					firstName: mockedAccount2.firstName,
					lastName: mockedAccount2.lastName,
				})
			);
		});

		it('should reject if loading all accounts failed', async () => {
			kcUsersMock.find.mockRejectedValueOnce('error');

			await expect(idm.getAllAccounts()).rejects.toBeTruthy();
		});
	});

	describe('updateAccount', () => {
		it('should allow to update an existing account', async () => {
			kcUsersMock.find.mockResolvedValueOnce([]);
			const accountId = 'user-1-id';
			const updateUserMock = kcUsersMock.update.mockResolvedValueOnce();
			const testAccount = { firstName: 'test', email: 'test@test.test' };

			const ret = await idm.updateAccount(accountId, testAccount);

			expect(ret).not.toBeNull();
			expect(ret).toBe(accountId);
			expect(updateUserMock).toBeCalledWith(
				expect.objectContaining({ id: accountId }),
				expect.objectContaining({ firstName: testAccount.firstName, email: testAccount.email })
			);
		});

		it('should enable accounts by default', async () => {
			kcUsersMock.find.mockResolvedValueOnce([]);
			const accountId = 'user-1-id';
			const updateUserMock = kcUsersMock.update.mockResolvedValueOnce();
			const testAccount = { firstName: 'test', email: 'test@test.test' };

			const ret = await idm.updateAccount(accountId, testAccount);

			expect(ret).not.toBeNull();
			expect(ret).toBe(accountId);
			expect(updateUserMock).toBeCalledWith(
				expect.objectContaining({ id: accountId }),
				expect.objectContaining({ enabled: true })
			);
		});

		it('should reject if account can not be updated', async () => {
			const accountId = 'user-1-id';
			const testAccount = { username: 'test', email: 'test@test.test' };
			kcUsersMock.update.mockRejectedValueOnce('error');

			await expect(idm.updateAccount(accountId, testAccount)).rejects.toBeTruthy();
		});
	});

	describe('deleteAccountById', () => {
		it('should allow to delete an existing account', async () => {
			kcUsersMock.find.mockResolvedValueOnce([]);
			const accountId = 'user-1-id';
			kcUsersMock.del.mockResolvedValueOnce();

			const ret = await idm.deleteAccountById(accountId);

			expect(ret).toBe(accountId);
		});

		it('should reject if account can not be deleted', async () => {
			const accountId = 'user-1-id';
			kcUsersMock.del.mockRejectedValueOnce('error');

			await expect(idm.deleteAccountById(accountId)).rejects.toBeTruthy();
		});
	});

	describe('updateAccountPassword', () => {
		it('should allow to update an existing accounts password', async () => {
			kcUsersMock.find.mockResolvedValueOnce([]);
			kcUsersMock.resetPassword.mockResolvedValueOnce();
			const accountId = 'user-1-id';
			const testAccountPassword = 'test';

			const ret = await idm.updateAccountPassword(accountId, testAccountPassword);

			expect(ret).not.toBeNull();
			expect(ret).toBe(accountId);

			expect(kcUsersMock.resetPassword).toBeCalledWith(
				expect.objectContaining({
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					credential: expect.objectContaining({ value: testAccountPassword }),
				})
			);
		});

		it('should reject if account password can not be updated', async () => {
			kcUsersMock.resetPassword.mockRejectedValueOnce('error');
			const accountId = 'user-1-id';
			const testAccountPassword = 'test';

			await expect(idm.updateAccountPassword(accountId, testAccountPassword)).rejects.toBeTruthy();
		});
	});

	describe('getUserAttribute', () => {
		describe('when user exists', () => {
			const setup = () => {
				const attributeName = 'attributeName';
				const attributeValue = 'attributeValue';
				kcUsersMock.findOne.mockResolvedValueOnce({
					...mockedAccount1,
					attributes: { attributeName: [attributeValue] },
				});
				return { attributeName, attributeValue };
			};

			it('should return attribute value', async () => {
				const { attributeName, attributeValue } = setup();
				const result = await idm.getUserAttribute(mockedAccount1.id, attributeName);
				expect(result).toEqual(attributeValue);
			});

			it('should return null if attribute does not exist', async () => {
				setup();
				const result = await idm.getUserAttribute(mockedAccount1.id, 'nonExistingAttribute');
				expect(result).toBeNull();
			});
		});

		describe('when user does not exist', () => {
			const setup = () => {
				kcUsersMock.findOne.mockResolvedValueOnce(undefined);
			};

			it('should throw an error', async () => {
				setup();
				await expect(idm.getUserAttribute('userId', 'attributeName')).rejects.toThrow(EntityNotFoundError);
			});
		});
	});

	describe('setUserAttribute', () => {
		describe('when user exists', () => {
			const setup = (seedAttributes?: Record<string, unknown>) => {
				const attributeName = 'attributeName';
				const attributeValue = 'attributeValue';
				kcUsersMock.findOne.mockResolvedValueOnce({
					...mockedAccount1,
					attributes: seedAttributes,
				});
				return { attributeName, attributeValue };
			};

			it('should create attributes and set attribute', async () => {
				const { attributeName, attributeValue } = setup();
				await idm.setUserAttribute(mockedAccount1.id, attributeName, attributeValue);
				expect(kcUsersMock.update).toBeCalledWith(
					expect.objectContaining({ id: mockedAccount1.id }),
					expect.objectContaining({ attributes: { [attributeName]: attributeValue } })
				);
			});

			// only needed to satisfy coverage
			it('should set the attribute value', async () => {
				const { attributeName, attributeValue } = setup({});
				await idm.setUserAttribute(mockedAccount1.id, attributeName, attributeValue);
				expect(kcUsersMock.update).toBeCalledWith(
					expect.objectContaining({ id: mockedAccount1.id }),
					expect.objectContaining({ attributes: { [attributeName]: attributeValue } })
				);
			});
		});

		describe('when user does not exist', () => {
			const setup = () => {
				kcUsersMock.findOne.mockResolvedValueOnce(undefined);
			};

			it('should throw an error', async () => {
				setup();
				await expect(idm.setUserAttribute('userId', 'attributeName', 'attributeValue')).rejects.toThrow(
					EntityNotFoundError
				);
			});
		});
	});
});
