import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { IServerConfig } from '@src/modules/server';
import { Logger } from '../../../core/logger';
import { AccountService } from './account.service';
import { AccountServiceDb } from './account-db.service';
import { AccountServiceIdm } from './account-idm.service';
import { AbstractAccountService } from './account.service.abstract';

describe('AccountService', () => {
	let module: TestingModule;
	let accountServiceIdm: AbstractAccountService;
	let accountServiceDb: AbstractAccountService;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				AccountService,
				{
					provide: AccountServiceDb,
					useValue: createMock<AccountServiceDb>(),
				},
				{
					provide: AccountServiceIdm,
					useValue: createMock<AccountServiceIdm>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService<IServerConfig, true>>(),
				},
			],
		}).compile();
		accountServiceDb = module.get(AccountServiceDb);
		accountServiceIdm = module.get(AccountServiceIdm);
	});

	describe('findById', () => {});

	describe('findByUserId', () => {});

	describe('findByUsernameAndSystemId', () => {});

	describe('findMultipleByUserId', () => {});

	describe('findByUserIdOrFail', () => {});

	describe('save', () => {});

	describe('updateUsername', () => {});

	describe('updateLastTriedFailedLogin', () => {});

	describe('updatePassword', () => {});

	describe('delete', () => {});

	describe('deleteByUserId', () => {});

	describe('searchByUsernamePartialMatch', () => {});
	
	describe('searchByUsernameExactMatch', () => {});
});
