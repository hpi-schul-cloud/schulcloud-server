import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { jwtPayloadFactory } from '@infra/auth-guard/testing';
import { JwtIssuerService } from '@infra/jwt-issuer';
import { JwtWhitelistAdapter } from '@infra/jwt-whitelist';
import { Logger } from '@infra/logger';
import { AccountService } from '@modules/account';
import { accountDoFactory } from '@modules/account/testing';
import { RoleName } from '@modules/role';
import { UserService } from '@modules/user';
import { userDoFactory } from '@modules/user/testing';
import { Test, type TestingModule } from '@nestjs/testing';
import jwt from 'jsonwebtoken';
import { boardImportJobFactory } from '../../testing';
import { BoardImportJobRejectedError } from '../error';
import { BoardImportJobLogReason } from '../type';
import { BoardImportTokenService } from './board-import-token.service';

describe(BoardImportTokenService.name, () => {
	let module: TestingModule;
	let service: BoardImportTokenService;
	let userService: DeepMocked<UserService>;
	let accountService: DeepMocked<AccountService>;
	let jwtIssuerService: DeepMocked<JwtIssuerService>;
	let jwtWhitelistAdapter: DeepMocked<JwtWhitelistAdapter>;
	let logger: DeepMocked<Logger>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardImportTokenService,
				{ provide: UserService, useValue: createMock<UserService>() },
				{ provide: AccountService, useValue: createMock<AccountService>() },
				{ provide: JwtIssuerService, useValue: createMock<JwtIssuerService>() },
				{ provide: JwtWhitelistAdapter, useValue: createMock<JwtWhitelistAdapter>() },
				{ provide: Logger, useValue: createMock<Logger>() },
			],
		}).compile();

		service = module.get(BoardImportTokenService);
		userService = module.get(UserService);
		accountService = module.get(AccountService);
		jwtIssuerService = module.get(JwtIssuerService);
		jwtWhitelistAdapter = module.get(JwtWhitelistAdapter);
		logger = module.get(Logger);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
		jest.useRealTimers();
	});

	describe('createToken', () => {
		describe('when the user has an active account', () => {
			const setup = () => {
				const now = new Date('2026-01-01T00:10:00.000Z');
				jest.useFakeTimers({ now });

				const remainingInSeconds = 15 * 60;
				const deadline = new Date(now.getTime() + remainingInSeconds * 1000);
				const role = { id: new ObjectId().toHexString(), name: RoleName.TEACHER };
				const user = userDoFactory.withRoles([role]).buildWithId();
				const account = accountDoFactory.build({ userId: user.id, systemId: new ObjectId().toHexString() });
				const job = boardImportJobFactory.build({ userId: user.id });
				const token = 'token';
				const payload = {
					accountId: account.id,
					userId: job.userId,
					schoolId: user.schoolId,
					roles: [role.id],
					systemId: account.systemId,
					isServiceAccount: false,
					support: false,
					supportUserId: undefined,
					isExternalUser: false,
				};
				const marginInSeconds = 60;
				const lifetimeInSeconds = remainingInSeconds + marginInSeconds;
				const logEntry = ['Board import token created', { jobId: job.id, userId: job.userId }] as const;

				userService.findByIdOrNull.mockResolvedValueOnce(user);
				accountService.findByUserId.mockResolvedValueOnce(account);
				jwtIssuerService.generateJwtAndAddToWhitelist.mockResolvedValueOnce(token);

				return { job, deadline, token, payload, lifetimeInSeconds, logEntry };
			};

			it('should create a token for the user that expires after the deadline of the job', async () => {
				const { job, deadline, payload, lifetimeInSeconds } = setup();

				await service.createToken(job, deadline);

				expect(jwtIssuerService.generateJwtAndAddToWhitelist).toHaveBeenCalledWith(payload, lifetimeInSeconds);
			});

			it('should return the token', async () => {
				const { job, deadline, token } = setup();

				const result = await service.createToken(job, deadline);

				expect(result).toEqual(token);
			});

			it('should log the job and the user', async () => {
				const { job, deadline, logEntry } = setup();

				await service.createToken(job, deadline);

				expect(logger.info).toHaveBeenCalledWith(...logEntry);
			});
		});

		describe('when the account has a deactivation date in the future', () => {
			const setup = () => {
				const user = userDoFactory.buildWithId();
				const deactivatedAt = new Date(Date.now() + 60 * 60 * 1000);
				const account = accountDoFactory.build({ userId: user.id, deactivatedAt });
				const job = boardImportJobFactory.build({ userId: user.id });
				const token = 'token';

				userService.findByIdOrNull.mockResolvedValueOnce(user);
				accountService.findByUserId.mockResolvedValueOnce(account);
				jwtIssuerService.generateJwtAndAddToWhitelist.mockResolvedValueOnce(token);

				const deadline = new Date(Date.now() + 60 * 1000);

				return { job, deadline, token };
			};

			it('should return the token', async () => {
				const { job, deadline, token } = setup();

				const result = await service.createToken(job, deadline);

				expect(result).toEqual(token);
			});
		});

		describe('when the user does not exist', () => {
			const setup = () => {
				const job = boardImportJobFactory.build();
				const error = new BoardImportJobRejectedError(BoardImportJobLogReason.USER_NOT_FOUND);

				userService.findByIdOrNull.mockResolvedValueOnce(null);

				const deadline = new Date(Date.now() + 60 * 1000);

				return { job, deadline, error };
			};

			it('should reject the job and create no token', async () => {
				const { job, deadline, error } = setup();

				await expect(service.createToken(job, deadline)).rejects.toEqual(error);

				expect(jwtIssuerService.generateJwtAndAddToWhitelist).not.toHaveBeenCalled();
			});
		});

		describe('when the user has no account', () => {
			const setup = () => {
				const user = userDoFactory.buildWithId();
				const job = boardImportJobFactory.build({ userId: user.id });
				const error = new BoardImportJobRejectedError(BoardImportJobLogReason.ACCOUNT_NOT_FOUND);

				userService.findByIdOrNull.mockResolvedValueOnce(user);
				accountService.findByUserId.mockResolvedValueOnce(null);

				const deadline = new Date(Date.now() + 60 * 1000);

				return { job, deadline, error };
			};

			it('should reject the job and create no token', async () => {
				const { job, deadline, error } = setup();

				await expect(service.createToken(job, deadline)).rejects.toEqual(error);

				expect(jwtIssuerService.generateJwtAndAddToWhitelist).not.toHaveBeenCalled();
			});
		});

		describe('when the account is deactivated', () => {
			const setup = () => {
				const user = userDoFactory.buildWithId();
				const deactivatedAt = new Date(Date.now() - 1000);
				const account = accountDoFactory.build({ userId: user.id, deactivatedAt });
				const job = boardImportJobFactory.build({ userId: user.id });
				const error = new BoardImportJobRejectedError(BoardImportJobLogReason.ACCOUNT_DEACTIVATED);

				userService.findByIdOrNull.mockResolvedValueOnce(user);
				accountService.findByUserId.mockResolvedValueOnce(account);

				const deadline = new Date(Date.now() + 60 * 1000);

				return { job, deadline, error };
			};

			it('should reject the job and create no token', async () => {
				const { job, deadline, error } = setup();

				await expect(service.createToken(job, deadline)).rejects.toEqual(error);

				expect(jwtIssuerService.generateJwtAndAddToWhitelist).not.toHaveBeenCalled();
			});
		});
	});

	describe('removeToken', () => {
		describe('when the token is valid', () => {
			const setup = () => {
				const job = boardImportJobFactory.build();
				const payload = jwtPayloadFactory.build();
				const token = jwt.sign({ ...payload }, 'secret');

				return { job, token, payload };
			};

			it('should remove the token from the whitelist', async () => {
				const { job, token, payload } = setup();

				await service.removeToken(job, token);

				expect(jwtWhitelistAdapter.removeFromWhitelist).toHaveBeenCalledWith(payload.accountId, payload.jti);
			});
		});

		describe('when the removal fails', () => {
			const setup = () => {
				const job = boardImportJobFactory.build();
				const token = jwt.sign({ ...jwtPayloadFactory.build() }, 'secret');
				const logEntry = ['Board import token not removed', { jobId: job.id }] as const;

				jwtWhitelistAdapter.removeFromWhitelist.mockRejectedValueOnce(new Error('no connection'));

				return { job, token, logEntry };
			};

			it('should resolve and log the job', async () => {
				const { job, token, logEntry } = setup();

				await expect(service.removeToken(job, token)).resolves.toBeUndefined();

				expect(logger.warning).toHaveBeenCalledWith(...logEntry);
			});
		});
	});
});
