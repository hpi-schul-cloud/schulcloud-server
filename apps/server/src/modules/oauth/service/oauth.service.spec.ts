import { LegacyLogger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { DefaultEncryptionService, EncryptionService, SymmetricKeyEncryptionService } from '@infra/encryption';
import { ObjectId } from '@mikro-orm/mongodb';
import { LegacySchoolService } from '@modules/legacy-school';
import { legacySchoolDoFactory } from '@modules/legacy-school/testing';
import { OauthAdapterService, OAuthTokenDto } from '@modules/oauth-adapter';
import { ProvisioningService } from '@modules/provisioning';
import { OauthDataDto } from '@modules/provisioning/dto';
import { SchoolFeature } from '@modules/school/domain';
import { System } from '@modules/system';
import { SystemService } from '@modules/system/domain';
import { OauthConfigEntity } from '@modules/system/repo';
import { systemFactory, systemOauthConfigFactory } from '@modules/system/testing';
import { UserService } from '@modules/user';
import { MigrationCheckService } from '@modules/user-login-migration';
import { userDoFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { externalUserDtoFactory } from '../../provisioning/testing';
import {
	OauthConfigMissingLoggableException,
	TokenInvalidLoggableException,
	UserNotFoundAfterProvisioningLoggableException,
} from '../loggable';
import { OAuthService } from './oauth.service';

jest.mock('jwks-rsa', () => () => {
	return {
		getKeys: jest.fn(),
		getSigningKey: jest.fn().mockResolvedValue({
			kid: 'kid',
			alg: 'alg',
			getPublicKey: jest.fn().mockReturnValue('publicKey'),
			rsaPublicKey: 'publicKey',
		}),
		getSigningKeys: jest.fn(),
	};
});

jest.mock('jsonwebtoken');

describe('OAuthService', () => {
	let module: TestingModule;
	let service: OAuthService;

	let oAuthEncryptionService: DeepMocked<SymmetricKeyEncryptionService>;
	let provisioningService: DeepMocked<ProvisioningService>;
	let userService: DeepMocked<UserService>;
	let systemService: DeepMocked<SystemService>;
	let oauthAdapterService: DeepMocked<OauthAdapterService>;
	let migrationCheckService: DeepMocked<MigrationCheckService>;
	let schoolService: DeepMocked<LegacySchoolService>;

	let testSystem: System;
	let testOauthConfig: OauthConfigEntity;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				OAuthService,
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: LegacySchoolService,
					useValue: createMock<LegacySchoolService>(),
				},
				{
					provide: DefaultEncryptionService,
					useValue: createMock<EncryptionService>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				{
					provide: ProvisioningService,
					useValue: createMock<ProvisioningService>(),
				},
				{
					provide: SystemService,
					useValue: createMock<SystemService>(),
				},
				{
					provide: OauthAdapterService,
					useValue: createMock<OauthAdapterService>(),
				},
				{
					provide: MigrationCheckService,
					useValue: createMock<MigrationCheckService>(),
				},
			],
		}).compile();
		service = module.get(OAuthService);

		oAuthEncryptionService = module.get(DefaultEncryptionService);
		provisioningService = module.get(ProvisioningService);
		userService = module.get(UserService);
		systemService = module.get(SystemService);
		oauthAdapterService = module.get(OauthAdapterService);
		migrationCheckService = module.get(MigrationCheckService);
		schoolService = module.get(LegacySchoolService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	beforeEach(() => {
		testSystem = systemFactory.withOauthConfig().build();
		testOauthConfig = testSystem.oauthConfig as OauthConfigEntity;
	});

	describe('requestToken', () => {
		const setupRequest = () => {
			const code = '43534543jnj543342jn2';
			const oauthToken = {
				accessToken: 'accessToken',
				idToken: 'idToken',
				refreshToken: 'refreshToken',
			};

			return {
				code,
				oauthToken,
			};
		};

		beforeEach(() => {
			const { oauthToken } = setupRequest();
			oAuthEncryptionService.decrypt.mockReturnValue('decryptedSecret');
			oauthAdapterService.sendTokenRequest.mockResolvedValue(oauthToken);
		});

		describe('when it requests a token', () => {
			it('should get token from the external server', async () => {
				const { code, oauthToken } = setupRequest();

				const result = await service.requestToken(code, testOauthConfig, 'redirectUri');

				expect(result).toEqual<OAuthTokenDto>({
					idToken: oauthToken.idToken,
					accessToken: oauthToken.accessToken,
					refreshToken: oauthToken.refreshToken,
				});
			});
		});
	});

	describe('validateToken', () => {
		describe('when the token is validated', () => {
			it('should validate id_token and return it decoded', async () => {
				jest.spyOn(jwt, 'verify').mockImplementationOnce((): JwtPayload => {
					return { sub: 'mockSub' };
				});

				const decodedJwt = await service.validateToken('idToken', testOauthConfig);

				expect(decodedJwt.sub).toStrictEqual('mockSub');
			});
		});

		describe('if no payload was returned', () => {
			it('should throw', async () => {
				jest.spyOn(jwt, 'verify').mockImplementationOnce((): string => 'string');

				await expect(service.validateToken('idToken', testOauthConfig)).rejects.toEqual(
					new TokenInvalidLoggableException()
				);
			});
		});
	});

	describe('validateLogoutToken', () => {
		describe('when the token is valid', () => {
			const setup = () => {
				const secret = 'secret';
				const jwtPayload = {
					sub: 'externalUserId',
					iss: 'externalSystem',
					events: { 'http://schemas.openid.net/event/backchannel-logout': {} },
				};
				const oauthConfig = systemOauthConfigFactory.build();

				oauthAdapterService.getPublicKey.mockResolvedValue(secret);
				jest.spyOn(jwt, 'verify').mockImplementationOnce(() => jwtPayload);

				return {
					secret,
					jwtPayload,
					oauthConfig,
				};
			};

			it('should return the decoded token', async () => {
				const { oauthConfig, jwtPayload } = setup();

				const result = await service.validateLogoutToken('token', oauthConfig);

				expect(result).toEqual(jwtPayload);
			});
		});

		describe('when the validation only returns a string', () => {
			const setup = () => {
				const secret = 'secret';
				const oauthConfig = systemOauthConfigFactory.build();

				oauthAdapterService.getPublicKey.mockResolvedValue(secret);
				jest.spyOn(jwt, 'verify').mockImplementationOnce(() => 'string');

				return {
					secret,
					oauthConfig,
				};
			};

			it('should throw an error', async () => {
				const { oauthConfig } = setup();

				await expect(service.validateLogoutToken('token', oauthConfig)).rejects.toEqual(
					new TokenInvalidLoggableException()
				);
			});
		});

		describe('when the token does not contain the backchannel-logout event', () => {
			const setup = () => {
				const secret = 'secret';
				const jwtPayload = { sub: 'externalUserId', iss: 'externalSystem' };
				const oauthConfig = systemOauthConfigFactory.build();

				oauthAdapterService.getPublicKey.mockResolvedValue(secret);
				jest.spyOn(jwt, 'verify').mockImplementationOnce(() => jwtPayload);

				return {
					secret,
					jwtPayload,
					oauthConfig,
				};
			};

			it('should throw an error', async () => {
				const { oauthConfig } = setup();

				await expect(service.validateLogoutToken('token', oauthConfig)).rejects.toEqual(
					new TokenInvalidLoggableException()
				);
			});
		});

		describe('when the token has a nonce', () => {
			const setup = () => {
				const secret = 'secret';
				const jwtPayload = {
					sub: 'externalUserId',
					iss: 'externalSystem',
					events: { 'http://schemas.openid.net/event/backchannel-logout': {} },
					nonce: '8321937182',
				};
				const oauthConfig = systemOauthConfigFactory.build();

				oauthAdapterService.getPublicKey.mockResolvedValue(secret);
				jest.spyOn(jwt, 'verify').mockImplementationOnce(() => jwtPayload);

				return {
					secret,
					jwtPayload,
					oauthConfig,
				};
			};

			it('should throw an error', async () => {
				const { oauthConfig } = setup();

				await expect(service.validateLogoutToken('token', oauthConfig)).rejects.toEqual(
					new TokenInvalidLoggableException()
				);
			});
		});
	});

	describe('authenticateUser is called', () => {
		const setup = () => {
			const authCode = '43534543jnj543342jn2';

			const system = systemFactory.withOauthConfig().build({
				displayName: 'External System',
			});

			const ldapSystem = systemFactory.withLdapConfig().build({
				displayName: 'External System',
			});

			const oauthToken = {
				accessToken: 'accessToken',
				idToken: 'idToken',
				refreshToken: 'refreshToken',
			};

			return {
				authCode,
				system,
				oauthToken,
				ldapSystem,
			};
		};

		describe('when system does not have oauth config', () => {
			it('should authenticate a user', async () => {
				const { authCode, system, oauthToken } = setup();
				systemService.findById.mockResolvedValue(testSystem);
				oAuthEncryptionService.decrypt.mockReturnValue('decryptedSecret');
				oauthAdapterService.getPublicKey.mockResolvedValue('publicKey');
				oauthAdapterService.sendTokenRequest.mockResolvedValue(oauthToken);

				const result = await service.authenticateUser(system.id, 'redirectUri', authCode);

				expect(result).toEqual<OAuthTokenDto>({
					accessToken: oauthToken.accessToken,
					idToken: oauthToken.idToken,
					refreshToken: oauthToken.refreshToken,
				});
			});
		});

		describe('when system does not have oauth config', () => {
			it('the authentication should fail', async () => {
				const { authCode, ldapSystem } = setup();

				systemService.findById.mockResolvedValueOnce(ldapSystem);

				const func = () => service.authenticateUser(testSystem.id, 'redirectUri', authCode);

				await expect(func).rejects.toThrow(new OauthConfigMissingLoggableException(testSystem.id));
			});
		});
	});

	describe('provisionUser', () => {
		describe('when provisioning a user and a school without official school number', () => {
			const setup = () => {
				const systemId = new ObjectId().toHexString();
				const idToken = 'idToken';
				const accessToken = 'accessToken';
				const externalUserId = 'externalUserId';

				const user = userDoFactory.build({
					id: new ObjectId().toHexString(),
					externalId: externalUserId,
				});

				const provisioningData = new OauthDataDto({
					system: {
						systemId,
						provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_ASYNC,
						provisioningUrl: 'https://mock.person-info.de/',
					},
					externalUser: externalUserDtoFactory.build({
						externalId: externalUserId,
					}),
					externalSchool: {
						externalId: 'externalSchoolId',
						name: 'External School',
					},
				});

				provisioningService.getData.mockResolvedValueOnce(provisioningData);
				userService.findByExternalId.mockResolvedValueOnce(user);

				return {
					systemId,
					idToken,
					accessToken,
					provisioningData,
					user,
				};
			};

			it('should provision the data', async () => {
				const { systemId, idToken, accessToken, provisioningData } = setup();

				await service.provisionUser(systemId, idToken, accessToken);

				expect(provisioningService.provisionData).toHaveBeenCalledWith(provisioningData);
			});

			it('should return the user', async () => {
				const { systemId, idToken, accessToken, user } = setup();

				const result = await service.provisionUser(systemId, idToken, accessToken);

				expect(result).toEqual(user);
			});
		});

		describe('when provisioning a user and a school without official school number, but the user cannot be found after the provisioning', () => {
			const setup = () => {
				const systemId = new ObjectId().toHexString();
				const idToken = 'idToken';
				const accessToken = 'accessToken';
				const externalUserId = 'externalUserId';

				const provisioningData = new OauthDataDto({
					system: {
						systemId,
						provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_ASYNC,
						provisioningUrl: 'https://mock.person-info.de/',
					},
					externalUser: externalUserDtoFactory.build({
						externalId: externalUserId,
					}),
					externalSchool: {
						externalId: 'externalSchoolId',
						name: 'External School',
					},
				});

				provisioningService.getData.mockResolvedValueOnce(provisioningData);
				userService.findByExternalId.mockResolvedValueOnce(null);

				return {
					systemId,
					idToken,
					accessToken,
					provisioningData,
				};
			};

			it('should throw an error', async () => {
				const { systemId, idToken, accessToken } = setup();

				await expect(service.provisionUser(systemId, idToken, accessToken)).rejects.toThrow(
					UserNotFoundAfterProvisioningLoggableException
				);
			});
		});

		describe('when provisioning a user and a new school with official school number', () => {
			const setup = () => {
				const systemId = new ObjectId().toHexString();
				const idToken = 'idToken';
				const accessToken = 'accessToken';
				const externalUserId = 'externalUserId';

				const user = userDoFactory.build({
					id: new ObjectId().toHexString(),
					externalId: externalUserId,
				});

				const provisioningData = new OauthDataDto({
					system: {
						systemId,
						provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_ASYNC,
						provisioningUrl: 'https://mock.person-info.de/',
					},
					externalUser: externalUserDtoFactory.build({
						externalId: externalUserId,
					}),
					externalSchool: {
						externalId: 'externalSchoolId',
						name: 'External School',
						officialSchoolNumber: 'officialSchoolNumber',
					},
				});

				provisioningService.getData.mockResolvedValueOnce(provisioningData);
				schoolService.getSchoolBySchoolNumber.mockResolvedValueOnce(null);
				migrationCheckService.shouldUserMigrate.mockResolvedValueOnce(false);
				userService.findByExternalId.mockResolvedValueOnce(user);

				return {
					systemId,
					idToken,
					accessToken,
					provisioningData,
					user,
				};
			};

			it('should provision the data', async () => {
				const { systemId, idToken, accessToken, provisioningData } = setup();

				await service.provisionUser(systemId, idToken, accessToken);

				expect(provisioningService.provisionData).toHaveBeenCalledWith(provisioningData);
			});

			it('should return the user', async () => {
				const { systemId, idToken, accessToken, user } = setup();

				const result = await service.provisionUser(systemId, idToken, accessToken);

				expect(result).toEqual(user);
			});
		});

		describe('when provisioning a user and an existing school with official school number, that has provisioning enabled', () => {
			const setup = () => {
				const systemId = new ObjectId().toHexString();
				const idToken = 'idToken';
				const accessToken = 'accessToken';
				const externalUserId = 'externalUserId';
				const externalSchoolId = 'externalSchoolId';
				const officialSchoolNumber = 'officialSchoolNumber';

				const user = userDoFactory.build({
					id: new ObjectId().toHexString(),
					externalId: externalUserId,
				});

				const school = legacySchoolDoFactory.build({
					id: new ObjectId().toHexString(),
					externalId: externalSchoolId,
					officialSchoolNumber,
					features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
				});

				const provisioningData = new OauthDataDto({
					system: {
						systemId,
						provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_ASYNC,
						provisioningUrl: 'https://mock.person-info.de/',
					},
					externalUser: externalUserDtoFactory.build({
						externalId: externalUserId,
					}),
					externalSchool: {
						externalId: externalSchoolId,
						name: school.name,
						officialSchoolNumber,
					},
				});

				provisioningService.getData.mockResolvedValueOnce(provisioningData);
				schoolService.getSchoolBySchoolNumber.mockResolvedValueOnce(school);
				migrationCheckService.shouldUserMigrate.mockResolvedValueOnce(false);
				userService.findByExternalId.mockResolvedValueOnce(user);

				return {
					systemId,
					idToken,
					accessToken,
					provisioningData,
					user,
				};
			};

			it('should provision the data', async () => {
				const { systemId, idToken, accessToken, provisioningData } = setup();

				await service.provisionUser(systemId, idToken, accessToken);

				expect(provisioningService.provisionData).toHaveBeenCalledWith(provisioningData);
			});

			it('should return the user', async () => {
				const { systemId, idToken, accessToken, user } = setup();

				const result = await service.provisionUser(systemId, idToken, accessToken);

				expect(result).toEqual(user);
			});
		});

		describe('when provisioning an existing user and an existing school with official school number, that has provisioning disabled', () => {
			const setup = () => {
				const systemId = new ObjectId().toHexString();
				const idToken = 'idToken';
				const accessToken = 'accessToken';
				const externalUserId = 'externalUserId';
				const externalSchoolId = 'externalSchoolId';
				const officialSchoolNumber = 'officialSchoolNumber';

				const user = userDoFactory.build({
					id: new ObjectId().toHexString(),
					externalId: externalUserId,
				});

				const school = legacySchoolDoFactory.build({
					id: new ObjectId().toHexString(),
					externalId: externalSchoolId,
					officialSchoolNumber,
					features: [],
				});

				const provisioningData = new OauthDataDto({
					system: {
						systemId,
						provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_ASYNC,
						provisioningUrl: 'https://mock.person-info.de/',
					},
					externalUser: externalUserDtoFactory.build({
						externalId: externalUserId,
					}),
					externalSchool: {
						externalId: externalSchoolId,
						name: school.name,
						officialSchoolNumber,
					},
				});

				provisioningService.getData.mockResolvedValueOnce(provisioningData);
				schoolService.getSchoolBySchoolNumber.mockResolvedValueOnce(school);
				migrationCheckService.shouldUserMigrate.mockResolvedValueOnce(false);
				userService.findByExternalId.mockResolvedValueOnce(user);

				return {
					systemId,
					idToken,
					accessToken,
					provisioningData,
					user,
				};
			};

			it('should not provision the data', async () => {
				const { systemId, idToken, accessToken } = setup();

				await service.provisionUser(systemId, idToken, accessToken);

				expect(provisioningService.provisionData).not.toHaveBeenCalled();
			});

			it('should return the user', async () => {
				const { systemId, idToken, accessToken, user } = setup();

				const result = await service.provisionUser(systemId, idToken, accessToken);

				expect(result).toEqual(user);
			});
		});

		describe('when provisioning a new user and an existing school with official school number, that has provisioning disabled', () => {
			const setup = () => {
				const systemId = new ObjectId().toHexString();
				const idToken = 'idToken';
				const accessToken = 'accessToken';
				const externalUserId = 'externalUserId';
				const externalSchoolId = 'externalSchoolId';
				const officialSchoolNumber = 'officialSchoolNumber';

				const school = legacySchoolDoFactory.build({
					id: new ObjectId().toHexString(),
					externalId: externalSchoolId,
					officialSchoolNumber,
					features: [],
				});

				const provisioningData = new OauthDataDto({
					system: {
						systemId,
						provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_ASYNC,
						provisioningUrl: 'https://mock.person-info.de/',
					},
					externalUser: externalUserDtoFactory.build({
						externalId: externalUserId,
					}),
					externalSchool: {
						externalId: externalSchoolId,
						name: school.name,
						officialSchoolNumber,
					},
				});

				provisioningService.getData.mockResolvedValueOnce(provisioningData);
				schoolService.getSchoolBySchoolNumber.mockResolvedValueOnce(school);
				migrationCheckService.shouldUserMigrate.mockResolvedValueOnce(false);
				userService.findByExternalId.mockResolvedValueOnce(null);

				return {
					systemId,
					idToken,
					accessToken,
					provisioningData,
				};
			};

			it('should not provision the data', async () => {
				const { systemId, idToken, accessToken } = setup();

				await expect(service.provisionUser(systemId, idToken, accessToken)).rejects.toThrow();

				expect(provisioningService.provisionData).not.toHaveBeenCalled();
			});

			it('should throw an error', async () => {
				const { systemId, idToken, accessToken } = setup();

				await expect(service.provisionUser(systemId, idToken, accessToken)).rejects.toThrow(
					UserNotFoundAfterProvisioningLoggableException
				);
			});
		});

		describe('when provisioning a new user and an existing school with official school number, that is currently migrating', () => {
			const setup = () => {
				const systemId = new ObjectId().toHexString();
				const idToken = 'idToken';
				const accessToken = 'accessToken';
				const externalUserId = 'externalUserId';
				const externalSchoolId = 'externalSchoolId';
				const officialSchoolNumber = 'officialSchoolNumber';

				const school = legacySchoolDoFactory.build({
					id: new ObjectId().toHexString(),
					externalId: externalSchoolId,
					officialSchoolNumber,
					features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
				});

				const provisioningData = new OauthDataDto({
					system: {
						systemId,
						provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_ASYNC,
						provisioningUrl: 'https://mock.person-info.de/',
					},
					externalUser: externalUserDtoFactory.build({
						externalId: externalUserId,
					}),
					externalSchool: {
						externalId: externalSchoolId,
						name: school.name,
						officialSchoolNumber,
					},
				});

				provisioningService.getData.mockResolvedValueOnce(provisioningData);
				schoolService.getSchoolBySchoolNumber.mockResolvedValueOnce(school);
				migrationCheckService.shouldUserMigrate.mockResolvedValueOnce(true);
				userService.findByExternalId.mockResolvedValueOnce(null);

				return {
					systemId,
					idToken,
					accessToken,
					provisioningData,
				};
			};

			it('should not provision the data', async () => {
				const { systemId, idToken, accessToken } = setup();

				await service.provisionUser(systemId, idToken, accessToken);

				expect(provisioningService.provisionData).not.toHaveBeenCalled();
			});

			it('should return null', async () => {
				const { systemId, idToken, accessToken } = setup();

				const result = await service.provisionUser(systemId, idToken, accessToken);

				expect(result).toBeNull();
			});
		});

		describe('when provisioning an existing user and an existing school with official school number, that is currently migrating', () => {
			const setup = () => {
				const systemId = new ObjectId().toHexString();
				const idToken = 'idToken';
				const accessToken = 'accessToken';
				const externalUserId = 'externalUserId';
				const externalSchoolId = 'externalSchoolId';
				const officialSchoolNumber = 'officialSchoolNumber';

				const user = userDoFactory.build({
					id: new ObjectId().toHexString(),
					externalId: externalUserId,
				});

				const school = legacySchoolDoFactory.build({
					id: new ObjectId().toHexString(),
					externalId: externalSchoolId,
					officialSchoolNumber,
					features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
				});

				const provisioningData = new OauthDataDto({
					system: {
						systemId,
						provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_ASYNC,
						provisioningUrl: 'https://mock.person-info.de/',
					},
					externalUser: externalUserDtoFactory.build({
						externalId: externalUserId,
					}),
					externalSchool: {
						externalId: externalSchoolId,
						name: school.name,
						officialSchoolNumber,
					},
				});

				provisioningService.getData.mockResolvedValueOnce(provisioningData);
				schoolService.getSchoolBySchoolNumber.mockResolvedValueOnce(school);
				migrationCheckService.shouldUserMigrate.mockResolvedValueOnce(true);
				userService.findByExternalId.mockResolvedValueOnce(user).mockResolvedValueOnce(user);

				return {
					systemId,
					idToken,
					accessToken,
					provisioningData,
					user,
				};
			};

			it('should provision the data', async () => {
				const { systemId, idToken, accessToken, provisioningData } = setup();

				await service.provisionUser(systemId, idToken, accessToken);

				expect(provisioningService.provisionData).toHaveBeenCalledWith(provisioningData);
			});

			it('should return the user', async () => {
				const { systemId, idToken, accessToken, user } = setup();

				const result = await service.provisionUser(systemId, idToken, accessToken);

				expect(result).toEqual(user);
			});
		});
	});
});
