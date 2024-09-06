import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons';
import { DefaultEncryptionService, EncryptionService, SymetricKeyEncryptionService } from '@infra/encryption';
import { ObjectId } from '@mikro-orm/mongodb';
import { LegacySchoolService } from '@modules/legacy-school';
import { ProvisioningService } from '@modules/provisioning';
import { OauthConfigEntity } from '@modules/system/entity';
import { SystemService } from '@modules/system/service';
import { systemFactory } from '@modules/system/testing';
import { UserService } from '@modules/user';
import { MigrationCheckService } from '@modules/user-login-migration';
import { Test, TestingModule } from '@nestjs/testing';
import { LegacySchoolDo, UserDO } from '@shared/domain/domainobject';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SchoolFeature } from '@shared/domain/types';
import { legacySchoolDoFactory, setupEntities, userDoFactory } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { OauthDataDto } from '@src/modules/provisioning/dto';
import { System } from '@src/modules/system';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { OAuthTokenDto } from '../interface';
import {
	IdTokenInvalidLoggableException,
	OauthConfigMissingLoggableException,
	UserNotFoundAfterProvisioningLoggableException,
} from '../loggable';
import { OauthAdapterService } from './oauth-adapter.service';
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

	let oAuthEncryptionService: DeepMocked<SymetricKeyEncryptionService>;
	let provisioningService: DeepMocked<ProvisioningService>;
	let userService: DeepMocked<UserService>;
	let systemService: DeepMocked<SystemService>;
	let oauthAdapterService: DeepMocked<OauthAdapterService>;
	let migrationCheckService: DeepMocked<MigrationCheckService>;
	let schoolService: DeepMocked<LegacySchoolService>;

	let testSystem: System;
	let testOauthConfig: OauthConfigEntity;

	const hostUri = 'https://mock.de';

	beforeAll(async () => {
		await setupEntities();

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
		jest.spyOn(Configuration, 'get').mockImplementation((key: string): unknown => {
			switch (key) {
				case 'HOST':
				case 'PUBLIC_BACKEND_URL':
					return hostUri;
				default:
					throw new Error(`No mock for key '${key}'`);
			}
		});

		testSystem = systemFactory.withOauthConfig().build();
		testOauthConfig = testSystem.oauthConfig as OauthConfigEntity;
	});

	describe('requestToken', () => {
		const setupRequest = () => {
			const code = '43534543jnj543342jn2';
			const oauthToken: OAuthTokenDto = {
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

				const result: OAuthTokenDto = await service.requestToken(code, testOauthConfig, 'redirectUri');

				expect(result).toEqual<OAuthTokenDto>({
					idToken: oauthToken.idToken,
					accessToken: oauthToken.accessToken,
					refreshToken: oauthToken.refreshToken,
				});
			});
		});
	});

	describe('validateToken', () => {
		afterEach(() => {
			jest.clearAllMocks();
		});
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
					new IdTokenInvalidLoggableException()
				);
			});
		});
	});

	describe('authenticateUser is called', () => {
		const setup = () => {
			const authCode = '43534543jnj543342jn2';

			const system: System = systemFactory.withOauthConfig().build({
				displayName: 'External System',
			});

			const ldapSystem: System = systemFactory.withLdapConfig().build({
				displayName: 'External System',
			});

			const oauthToken: OAuthTokenDto = {
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

				const result: OAuthTokenDto = await service.authenticateUser(system.id, 'redirectUri', authCode);

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

				const user: UserDO = userDoFactory.build({
					id: new ObjectId().toHexString(),
					externalId: externalUserId,
				});

				const provisioningData: OauthDataDto = new OauthDataDto({
					system: {
						systemId,
						provisioningStrategy: SystemProvisioningStrategy.SANIS,
						provisioningUrl: 'https://mock.person-info.de/',
					},
					externalUser: {
						externalId: externalUserId,
					},
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

				const provisioningData: OauthDataDto = new OauthDataDto({
					system: {
						systemId,
						provisioningStrategy: SystemProvisioningStrategy.SANIS,
						provisioningUrl: 'https://mock.person-info.de/',
					},
					externalUser: {
						externalId: externalUserId,
					},
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

				const user: UserDO = userDoFactory.build({
					id: new ObjectId().toHexString(),
					externalId: externalUserId,
				});

				const provisioningData: OauthDataDto = new OauthDataDto({
					system: {
						systemId,
						provisioningStrategy: SystemProvisioningStrategy.SANIS,
						provisioningUrl: 'https://mock.person-info.de/',
					},
					externalUser: {
						externalId: externalUserId,
					},
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

				const user: UserDO = userDoFactory.build({
					id: new ObjectId().toHexString(),
					externalId: externalUserId,
				});

				const school: LegacySchoolDo = legacySchoolDoFactory.build({
					id: new ObjectId().toHexString(),
					externalId: externalSchoolId,
					officialSchoolNumber,
					features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
				});

				const provisioningData: OauthDataDto = new OauthDataDto({
					system: {
						systemId,
						provisioningStrategy: SystemProvisioningStrategy.SANIS,
						provisioningUrl: 'https://mock.person-info.de/',
					},
					externalUser: {
						externalId: externalUserId,
					},
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

				const user: UserDO = userDoFactory.build({
					id: new ObjectId().toHexString(),
					externalId: externalUserId,
				});

				const school: LegacySchoolDo = legacySchoolDoFactory.build({
					id: new ObjectId().toHexString(),
					externalId: externalSchoolId,
					officialSchoolNumber,
					features: [],
				});

				const provisioningData: OauthDataDto = new OauthDataDto({
					system: {
						systemId,
						provisioningStrategy: SystemProvisioningStrategy.SANIS,
						provisioningUrl: 'https://mock.person-info.de/',
					},
					externalUser: {
						externalId: externalUserId,
					},
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

				const school: LegacySchoolDo = legacySchoolDoFactory.build({
					id: new ObjectId().toHexString(),
					externalId: externalSchoolId,
					officialSchoolNumber,
					features: [],
				});

				const provisioningData: OauthDataDto = new OauthDataDto({
					system: {
						systemId,
						provisioningStrategy: SystemProvisioningStrategy.SANIS,
						provisioningUrl: 'https://mock.person-info.de/',
					},
					externalUser: {
						externalId: externalUserId,
					},
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

				const school: LegacySchoolDo = legacySchoolDoFactory.build({
					id: new ObjectId().toHexString(),
					externalId: externalSchoolId,
					officialSchoolNumber,
					features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
				});

				const provisioningData: OauthDataDto = new OauthDataDto({
					system: {
						systemId,
						provisioningStrategy: SystemProvisioningStrategy.SANIS,
						provisioningUrl: 'https://mock.person-info.de/',
					},
					externalUser: {
						externalId: externalUserId,
					},
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

				const user: UserDO = userDoFactory.build({
					id: new ObjectId().toHexString(),
					externalId: externalUserId,
				});

				const school: LegacySchoolDo = legacySchoolDoFactory.build({
					id: new ObjectId().toHexString(),
					externalId: externalSchoolId,
					officialSchoolNumber,
					features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
				});

				const provisioningData: OauthDataDto = new OauthDataDto({
					system: {
						systemId,
						provisioningStrategy: SystemProvisioningStrategy.SANIS,
						provisioningUrl: 'https://mock.person-info.de/',
					},
					externalUser: {
						externalId: externalUserId,
					},
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
