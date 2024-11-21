import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import { ObjectId } from '@mikro-orm/mongodb';
import { PseudonymService } from '@modules/pseudonym/service';
import { UserService } from '@modules/user';
import { InternalServerErrorException, UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Pseudonym, UserDO } from '@shared/domain/domainobject';
import { RoleName } from '@shared/domain/interface';
import { userDoFactory } from '@shared/testing';
import { pseudonymFactory } from '@shared/testing/factory/domainobject/pseudonym.factory';
import { Authorization } from 'oauth-1.0a';
import { LtiMessageType, LtiPrivacyPermission, LtiRole, ToolContextType } from '../../../common/enum';
import { ContextExternalTool } from '../../../context-external-tool/domain';
import { contextExternalToolFactory } from '../../../context-external-tool/testing';
import { ExternalTool } from '../../../external-tool/domain';
import { externalToolFactory } from '../../../external-tool/testing';
import { SchoolExternalTool } from '../../../school-external-tool/domain';
import { schoolExternalToolFactory } from '../../../school-external-tool/testing';
import { LaunchRequestMethod, PropertyData, PropertyLocation, ToolLaunchRequest } from '../../types';
import {
	AutoContextIdStrategy,
	AutoContextNameStrategy,
	AutoGroupExternalUuidStrategy,
	AutoMediumIdStrategy,
	AutoSchoolIdStrategy,
	AutoSchoolNumberStrategy,
} from '../auto-parameter-strategy';
import { Lti11EncryptionService } from '../lti11-encryption.service';
import { Lti11ToolLaunchStrategy } from './lti11-tool-launch.strategy';
import { ToolLaunchParams } from './tool-launch-params.interface';

describe(Lti11ToolLaunchStrategy.name, () => {
	let module: TestingModule;
	let strategy: Lti11ToolLaunchStrategy;

	let userService: DeepMocked<UserService>;
	let pseudonymService: DeepMocked<PseudonymService>;
	let lti11EncryptionService: DeepMocked<Lti11EncryptionService>;
	let encryptionService: DeepMocked<EncryptionService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				Lti11ToolLaunchStrategy,
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: PseudonymService,
					useValue: createMock<PseudonymService>(),
				},
				{
					provide: Lti11EncryptionService,
					useValue: createMock<Lti11EncryptionService>(),
				},
				{
					provide: AutoSchoolIdStrategy,
					useValue: createMock<AutoSchoolIdStrategy>(),
				},
				{
					provide: AutoSchoolNumberStrategy,
					useValue: createMock<AutoSchoolNumberStrategy>(),
				},
				{
					provide: AutoContextIdStrategy,
					useValue: createMock<AutoContextIdStrategy>(),
				},
				{
					provide: AutoContextNameStrategy,
					useValue: createMock<AutoContextNameStrategy>(),
				},
				{
					provide: AutoMediumIdStrategy,
					useValue: createMock<AutoMediumIdStrategy>(),
				},
				{
					provide: AutoGroupExternalUuidStrategy,
					useValue: createMock<AutoGroupExternalUuidStrategy>(),
				},
				{
					provide: DefaultEncryptionService,
					useValue: createMock<EncryptionService>(),
				},
			],
		}).compile();

		strategy = module.get(Lti11ToolLaunchStrategy);

		userService = module.get(UserService);
		pseudonymService = module.get(PseudonymService);
		lti11EncryptionService = module.get(Lti11EncryptionService);
		encryptionService = module.get(DefaultEncryptionService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('buildToolLaunchDataFromConcreteConfig', () => {
		describe('when building the launch data for the encryption', () => {
			const setup = () => {
				const mockKey = 'mockKey';
				const mockSecret = 'mockSecret';
				const ltiMessageType = LtiMessageType.BASIC_LTI_LAUNCH_REQUEST;
				const launchPresentationLocale = 'de-DE';

				const externalTool: ExternalTool = externalToolFactory
					.withLti11Config({
						key: mockKey,
						secret: mockSecret,
						lti_message_type: ltiMessageType,
						privacy_permission: LtiPrivacyPermission.PUBLIC,
						launch_presentation_locale: launchPresentationLocale,
					})
					.build();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build();

				const data: ToolLaunchParams = {
					contextExternalTool,
					schoolExternalTool,
					externalTool,
				};

				const user: UserDO = userDoFactory.buildWithId({
					roles: [
						{
							id: 'roleId1',
							name: RoleName.TEACHER,
						},
						{
							id: 'roleId2',
							name: RoleName.USER,
						},
					],
				});

				const decrypted = 'decryptedSecret';
				encryptionService.decrypt.mockReturnValue(decrypted);
				userService.findById.mockResolvedValue(user);

				return {
					data,
					decrypted,
					user,
					mockKey,
					mockSecret,
					ltiMessageType,
					contextExternalTool,
					launchPresentationLocale,
				};
			};

			it('should contain lti key and secret without location', async () => {
				const { data, mockKey, decrypted } = setup();

				const result: PropertyData[] = await strategy.buildToolLaunchDataFromConcreteConfig('userId', data);

				expect(result).toEqual(
					expect.arrayContaining([
						new PropertyData({ name: 'key', value: mockKey }),
						new PropertyData({ name: 'secret', value: decrypted }),
					])
				);
			});
		});

		describe('when lti privacyPermission is public', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory
					.withLti11Config({
						key: 'mockKey',
						secret: 'mockSecret',
						lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
						privacy_permission: LtiPrivacyPermission.PUBLIC,
					})
					.build();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build();

				const data: ToolLaunchParams = {
					contextExternalTool,
					schoolExternalTool,
					externalTool,
				};

				const userId: string = new ObjectId().toHexString();
				const userEmail = 'user@email.com';
				const user: UserDO = userDoFactory.buildWithId(
					{
						email: userEmail,
						roles: [
							{
								id: 'roleId1',
								name: RoleName.TEACHER,
							},
							{
								id: 'roleId2',
								name: RoleName.USER,
							},
						],
					},
					userId
				);

				const userDisplayName = 'Hans Peter Test';

				userService.findById.mockResolvedValue(user);
				userService.getDisplayName.mockResolvedValue(userDisplayName);

				return {
					data,
					userId,
					userDisplayName,
					userEmail,
				};
			};

			it('should contain all user related attributes', async () => {
				const { data, userId, userDisplayName, userEmail } = setup();

				const result: PropertyData[] = await strategy.buildToolLaunchDataFromConcreteConfig(userId, data);

				expect(result).toEqual(
					expect.arrayContaining([
						new PropertyData({
							name: 'roles',
							value: `${LtiRole.INSTRUCTOR},${LtiRole.LEARNER}`,
							location: PropertyLocation.BODY,
						}),
						new PropertyData({ name: 'lis_person_name_full', value: userDisplayName, location: PropertyLocation.BODY }),
						new PropertyData({
							name: 'lis_person_contact_email_primary',
							value: userEmail,
							location: PropertyLocation.BODY,
						}),
						new PropertyData({ name: 'user_id', value: userId, location: PropertyLocation.BODY }),
					])
				);
			});
		});

		describe('when lti privacyPermission is name', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory
					.withLti11Config({
						key: 'mockKey',
						secret: 'mockSecret',
						lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
						privacy_permission: LtiPrivacyPermission.NAME,
					})
					.build();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build();

				const data: ToolLaunchParams = {
					contextExternalTool,
					schoolExternalTool,
					externalTool,
				};

				const userId: string = new ObjectId().toHexString();
				const user: UserDO = userDoFactory.buildWithId(
					{
						roles: [
							{
								id: 'roleId1',
								name: RoleName.TEACHER,
							},
							{
								id: 'roleId2',
								name: RoleName.USER,
							},
						],
					},
					userId
				);

				const userDisplayName = 'Hans Peter Test';

				userService.findById.mockResolvedValue(user);
				userService.getDisplayName.mockResolvedValue(userDisplayName);

				return {
					data,
					userId,
					userDisplayName,
				};
			};

			it('should contain the user name and id', async () => {
				const { data, userId, userDisplayName } = setup();

				const result: PropertyData[] = await strategy.buildToolLaunchDataFromConcreteConfig(userId, data);

				expect(result).toEqual(
					expect.arrayContaining([
						new PropertyData({
							name: 'roles',
							value: `${LtiRole.INSTRUCTOR},${LtiRole.LEARNER}`,
							location: PropertyLocation.BODY,
						}),
						new PropertyData({ name: 'lis_person_name_full', value: userDisplayName, location: PropertyLocation.BODY }),
						new PropertyData({ name: 'user_id', value: userId, location: PropertyLocation.BODY }),
					])
				);
				expect(result).not.toEqual(
					expect.arrayContaining([expect.objectContaining({ name: 'lis_person_contact_email_primary' })])
				);
			});
		});

		describe('when lti privacyPermission is email', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory
					.withLti11Config({
						key: 'mockKey',
						secret: 'mockSecret',
						lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
						privacy_permission: LtiPrivacyPermission.EMAIL,
					})
					.build();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build();

				const data: ToolLaunchParams = {
					contextExternalTool,
					schoolExternalTool,
					externalTool,
				};

				const userId: string = new ObjectId().toHexString();
				const userEmail = 'user@email.com';
				const user: UserDO = userDoFactory.buildWithId(
					{
						email: userEmail,
						roles: [
							{
								id: 'roleId1',
								name: RoleName.TEACHER,
							},
							{
								id: 'roleId2',
								name: RoleName.USER,
							},
						],
					},
					userId
				);

				userService.findById.mockResolvedValue(user);

				return {
					data,
					userId,
					userEmail,
				};
			};

			it('should contain the user email and id', async () => {
				const { data, userId, userEmail } = setup();

				const result: PropertyData[] = await strategy.buildToolLaunchDataFromConcreteConfig(userId, data);

				expect(result).toEqual(
					expect.arrayContaining([
						new PropertyData({
							name: 'roles',
							value: `${LtiRole.INSTRUCTOR},${LtiRole.LEARNER}`,
							location: PropertyLocation.BODY,
						}),
						new PropertyData({
							name: 'lis_person_contact_email_primary',
							value: userEmail,
							location: PropertyLocation.BODY,
						}),
						new PropertyData({ name: 'user_id', value: userId, location: PropertyLocation.BODY }),
					])
				);
				expect(result).not.toEqual(expect.arrayContaining([expect.objectContaining({ name: 'lis_person_name_full' })]));
			});
		});

		describe('when lti privacyPermission is pseudonymous', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory
					.withLti11Config({
						key: 'mockKey',
						secret: 'mockSecret',
						lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
						privacy_permission: LtiPrivacyPermission.PSEUDONYMOUS,
					})
					.build();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build();

				const data: ToolLaunchParams = {
					contextExternalTool,
					schoolExternalTool,
					externalTool,
				};

				const user: UserDO = userDoFactory.buildWithId({
					roles: [
						{
							id: 'roleId1',
							name: RoleName.TEACHER,
						},
						{
							id: 'roleId2',
							name: RoleName.USER,
						},
					],
				});

				const pseudonym: Pseudonym = pseudonymFactory.build();

				userService.findById.mockResolvedValue(user);
				pseudonymService.findOrCreatePseudonym.mockResolvedValue(pseudonym);

				return {
					data,
					pseudonym,
				};
			};

			it('should contain the pseudonymised user id', async () => {
				const { data, pseudonym } = setup();

				const result: PropertyData[] = await strategy.buildToolLaunchDataFromConcreteConfig('userId', data);

				expect(result).toEqual(
					expect.arrayContaining([
						new PropertyData({
							name: 'roles',
							value: `${LtiRole.INSTRUCTOR},${LtiRole.LEARNER}`,
							location: PropertyLocation.BODY,
						}),
						new PropertyData({ name: 'user_id', value: pseudonym.pseudonym, location: PropertyLocation.BODY }),
					])
				);
				expect(result).not.toEqual(
					expect.arrayContaining([
						expect.objectContaining({ name: 'lis_person_name_full' }),
						expect.objectContaining({ name: 'lis_person_contact_email_primary' }),
					])
				);
			});
		});

		describe('when lti privacyPermission is anonymous', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory
					.withLti11Config({
						key: 'mockKey',
						secret: 'mockSecret',
						lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
						privacy_permission: LtiPrivacyPermission.ANONYMOUS,
					})
					.build();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build();

				const data: ToolLaunchParams = {
					contextExternalTool,
					schoolExternalTool,
					externalTool,
				};

				const user: UserDO = userDoFactory.buildWithId({
					roles: [
						{
							id: 'roleId1',
							name: RoleName.TEACHER,
						},
						{
							id: 'roleId2',
							name: RoleName.USER,
						},
					],
				});

				userService.findById.mockResolvedValue(user);

				return {
					data,
				};
			};

			it('should not contain user related information', async () => {
				const { data } = setup();

				const result: PropertyData[] = await strategy.buildToolLaunchDataFromConcreteConfig('userId', data);

				expect(result).not.toEqual(
					expect.arrayContaining([
						expect.objectContaining({ name: 'lis_person_name_full' }),
						expect.objectContaining({ name: 'lis_person_contact_email_primary' }),
						expect.objectContaining({ name: 'user_id' }),
						expect.objectContaining({ name: 'roles' }),
					])
				);
			});
		});

		describe('when tool config is not lti', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.build();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build();

				const data: ToolLaunchParams = {
					contextExternalTool,
					schoolExternalTool,
					externalTool,
				};

				return {
					data,
				};
			};

			it('should throw an UnprocessableEntityException', async () => {
				const { data } = setup();

				const func = async () => strategy.buildToolLaunchDataFromConcreteConfig('userId', data);

				await expect(func).rejects.toThrow(
					new UnprocessableEntityException(
						'Unable to build LTI 1.1 launch data. Tool configuration is of type basic. Expected "lti11"'
					)
				);
			});
		});

		describe('when context external tool id is undefined', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory
					.withLti11Config({
						key: 'mockKey',
						secret: 'mockSecret',
						lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
						privacy_permission: LtiPrivacyPermission.ANONYMOUS,
					})
					.build();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
				const pseudoContextExternalTool = {
					...contextExternalToolFactory.build().getProps(),
					id: undefined,
				};

				const data: ToolLaunchParams = {
					contextExternalTool: pseudoContextExternalTool,
					schoolExternalTool,
					externalTool,
				};

				const user: UserDO = userDoFactory.buildWithId({
					roles: [
						{
							id: 'roleId1',
							name: RoleName.TEACHER,
						},
					],
				});

				userService.findById.mockResolvedValue(user);

				return {
					data,
				};
			};

			it('should use a random id', async () => {
				const { data } = setup();

				const result = await strategy.buildToolLaunchDataFromConcreteConfig('userId', data);

				expect(result).toContainEqual(
					new PropertyData({
						name: 'resource_link_id',
						value: expect.any(String),
						location: PropertyLocation.BODY,
					})
				);
			});
		});

		describe('when lti messageType is content item selection request', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory
					.withLti11Config({
						key: 'mockKey',
						secret: 'mockSecret',
						lti_message_type: LtiMessageType.CONTENT_ITEM_SELECTION_REQUEST,
						privacy_permission: LtiPrivacyPermission.ANONYMOUS,
					})
					.build();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build();

				const data: ToolLaunchParams = {
					contextExternalTool,
					schoolExternalTool,
					externalTool,
				};

				const userId: string = new ObjectId().toHexString();
				const user: UserDO = userDoFactory.buildWithId(
					{
						roles: [
							{
								id: 'roleId1',
								name: RoleName.TEACHER,
							},
							{
								id: 'roleId2',
								name: RoleName.USER,
							},
						],
					},
					userId
				);

				const publicBackendUrl = Configuration.get('PUBLIC_BACKEND_URL') as string;
				const callbackUrl = `${publicBackendUrl}/v3/tools/context-external-tools/${contextExternalTool.id}/lti11-deep-link-callback`;

				userService.findById.mockResolvedValue(user);
				const decrypted = 'decryptedSecret';
				encryptionService.decrypt.mockReturnValue(decrypted);

				return {
					data,
					userId,
					callbackUrl,
				};
			};

			it('should contain all user related attributes', async () => {
				const { data, userId, callbackUrl } = setup();

				const result: PropertyData[] = await strategy.buildToolLaunchDataFromConcreteConfig(userId, data);

				expect(result).toEqual(
					expect.arrayContaining([
						new PropertyData({ name: 'key', value: 'mockKey' }),
						new PropertyData({ name: 'secret', value: 'decryptedSecret' }),
						new PropertyData({
							name: 'lti_message_type',
							value: LtiMessageType.CONTENT_ITEM_SELECTION_REQUEST,
							location: PropertyLocation.BODY,
						}),
						new PropertyData({ name: 'lti_version', value: 'LTI-1p0', location: PropertyLocation.BODY }),
						new PropertyData({
							name: 'resource_link_id',
							value: data.contextExternalTool.id as string,
							location: PropertyLocation.BODY,
						}),
						new PropertyData({
							name: 'launch_presentation_document_target',
							value: 'window',
							location: PropertyLocation.BODY,
						}),
						new PropertyData({
							location: PropertyLocation.BODY,
							name: 'launch_presentation_locale',
							value: 'de-DE',
						}),
						new PropertyData({
							name: 'content_item_return_url',
							value: callbackUrl,
							location: PropertyLocation.BODY,
						}),
						new PropertyData({
							name: 'accept_media_types',
							value: '*/*',
							location: PropertyLocation.BODY,
						}),
						new PropertyData({
							name: 'accept_presentation_document_targets',
							value: 'window',
							location: PropertyLocation.BODY,
						}),
						new PropertyData({
							name: 'accept_unsigned',
							value: 'false',
							location: PropertyLocation.BODY,
						}),
						new PropertyData({
							name: 'accept_multiple',
							value: 'false',
							location: PropertyLocation.BODY,
						}),
						new PropertyData({
							name: 'accept_copy_advice',
							value: 'false',
							location: PropertyLocation.BODY,
						}),
						new PropertyData({
							name: 'auto_create',
							value: 'true',
							location: PropertyLocation.BODY,
						}),
						new PropertyData({
							name: 'data',
							value: expect.any(String),
							location: PropertyLocation.BODY,
						}),
					])
				);
			});
		});

		describe('when a content item selection request is made without a permanent tool', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory
					.withLti11Config({
						key: 'mockKey',
						secret: 'mockSecret',
						lti_message_type: LtiMessageType.CONTENT_ITEM_SELECTION_REQUEST,
						privacy_permission: LtiPrivacyPermission.ANONYMOUS,
					})
					.build();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
				const pseudoContextExternalTool = {
					...contextExternalToolFactory.build().getProps(),
					id: undefined,
				};

				const data: ToolLaunchParams = {
					contextExternalTool: pseudoContextExternalTool,
					schoolExternalTool,
					externalTool,
				};

				const userId: string = new ObjectId().toHexString();
				const user: UserDO = userDoFactory.buildWithId(
					{
						roles: [
							{
								id: 'roleId1',
								name: RoleName.TEACHER,
							},
							{
								id: 'roleId2',
								name: RoleName.USER,
							},
						],
					},
					userId
				);

				userService.findById.mockResolvedValue(user);
				const decrypted = 'decryptedSecret';
				encryptionService.decrypt.mockReturnValue(decrypted);

				return {
					data,
					userId,
				};
			};

			it('should throw an error', async () => {
				const { data, userId } = setup();

				await expect(() => strategy.buildToolLaunchDataFromConcreteConfig(userId, data)).rejects.toThrow(
					new UnprocessableEntityException(
						'Cannot lauch a content selection request with a non-permanent context external tool'
					)
				);
			});
		});
	});

	describe('buildToolLaunchRequestPayload', () => {
		describe('when key and secret are provided', () => {
			const setup = () => {
				const property1: PropertyData = new PropertyData({
					name: 'param1',
					value: 'value1',
					location: PropertyLocation.BODY,
				});

				const property2: PropertyData = new PropertyData({
					name: 'param2',
					value: 'value2',
					location: PropertyLocation.BODY,
				});

				const property3: PropertyData = new PropertyData({
					name: 'param2',
					value: 'value2',
					location: PropertyLocation.PATH,
				});

				const mockKey = 'mockKey';
				const keyProperty: PropertyData = new PropertyData({
					name: 'key',
					value: mockKey,
				});

				const secretProperty: PropertyData = new PropertyData({
					name: 'secret',
					value: 'mockSecret',
				});

				const url = 'https://example.com/';

				const signedPayload: Authorization = {
					oauth_consumer_key: mockKey,
					oauth_nonce: 'nonce',
					oauth_signature: 'signature',
					oauth_signature_method: 'HMAC-SHA1',
					oauth_timestamp: 1,
					oauth_version: '1.0',
					[property1.name]: property1.value,
					[property2.name]: property2.value,
				};

				lti11EncryptionService.sign.mockReturnValue(signedPayload);

				return {
					properties: [property1, property2, property3, keyProperty, secretProperty],
					url,
					signedPayload,
				};
			};

			it('should return a OAuth1 signed payload', () => {
				const { properties, signedPayload } = setup();

				const payload: string | null = strategy.buildToolLaunchRequestPayload('url', properties);

				expect(payload).toEqual(JSON.stringify(signedPayload));
			});

			it('should not return a payload with the signing secret', () => {
				const { properties } = setup();

				strategy.buildToolLaunchRequestPayload('url', properties);

				expect(lti11EncryptionService.sign).not.toHaveBeenCalledWith(
					expect.anything(),
					expect.anything(),
					expect.anything(),
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					expect.objectContaining({ secret: expect.anything() })
				);
			});
		});

		describe('when key or secret is missing', () => {
			const setup = () => {
				const property1: PropertyData = new PropertyData({
					name: 'param1',
					value: 'value1',
					location: PropertyLocation.BODY,
				});

				const property2: PropertyData = new PropertyData({
					name: 'param2',
					value: 'value2',
					location: PropertyLocation.BODY,
				});

				const property3: PropertyData = new PropertyData({
					name: 'param2',
					value: 'value2',
					location: PropertyLocation.PATH,
				});

				const url = 'https://example.com/';

				return {
					properties: [property1, property2, property3],
					url,
				};
			};

			it('should throw an InternalServerErrorException', () => {
				const { properties } = setup();

				const func = () => strategy.buildToolLaunchRequestPayload('url', properties);

				expect(func).toThrow(
					new InternalServerErrorException(
						'Unable to build LTI 1.1 launch payload. "key" or "secret" is undefined in PropertyData'
					)
				);
			});
		});
	});

	describe('determineLaunchRequestMethod', () => {
		it('should return POST', () => {
			const result: LaunchRequestMethod = strategy.determineLaunchRequestMethod([]);

			expect(result).toEqual(LaunchRequestMethod.POST);
		});
	});

	describe('createLaunchRequest', () => {
		describe('when lti message type is content item selection request', () => {
			const setup = () => {
				const userId: string = new ObjectId().toHexString();
				const user: UserDO = userDoFactory.buildWithId({ id: userId });

				const externalTool = externalToolFactory
					.withLti11Config({
						key: 'mockKey',
						secret: 'mockSecret',
						lti_message_type: LtiMessageType.CONTENT_ITEM_SELECTION_REQUEST,
						privacy_permission: LtiPrivacyPermission.ANONYMOUS,
					})
					.build();

				const schoolExternalTool = schoolExternalToolFactory.build({ toolId: externalTool.id });

				const contextExternalToolId = 'contextExternalToolId';
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
					id: contextExternalToolId,
					schoolToolRef: {
						schoolToolId: schoolExternalTool.id,
						schoolId: schoolExternalTool.schoolId,
					},
					contextRef: {
						type: ToolContextType.COURSE,
					},
				});

				const data: ToolLaunchParams = {
					contextExternalTool,
					schoolExternalTool,
					externalTool,
				};

				const property1: PropertyData = new PropertyData({
					name: 'param1',
					value: 'value1',
					location: PropertyLocation.BODY,
				});

				const property2: PropertyData = new PropertyData({
					name: 'param2',
					value: 'value2',
					location: PropertyLocation.BODY,
				});

				const signedPayload: Authorization = {
					oauth_consumer_key: 'mockKey',
					oauth_nonce: 'nonce',
					oauth_signature: 'signature',
					oauth_signature_method: 'HMAC-SHA1',
					oauth_timestamp: 1,
					oauth_version: '1.0',
					[property1.name]: property1.value,
					[property2.name]: property2.value,
				};

				const toolLaunchRequest: ToolLaunchRequest = new ToolLaunchRequest({
					method: LaunchRequestMethod.POST,
					url: 'https://www.lti11-baseurl.com/',
					payload: JSON.stringify(signedPayload),
					openNewTab: true,
					isDeepLink: true,
				});

				userService.findById.mockResolvedValue(user);
				const decrypted = 'decryptedSecret';
				encryptionService.decrypt.mockReturnValue(decrypted);

				return {
					toolLaunchRequest,
					data,
					userId,
				};
			};

			it('should create a LaunchRequest with the correct method, url and payload', async () => {
				const { toolLaunchRequest, data, userId } = setup();

				const result: ToolLaunchRequest = await strategy.createLaunchRequest(userId, data);

				expect(result).toEqual<ToolLaunchRequest>(toolLaunchRequest);
			});
		});

		describe('when lti message type is not content item selection request and no deeplink', () => {
			const setup = () => {
				const userId: string = new ObjectId().toHexString();
				const user: UserDO = userDoFactory.buildWithId({ id: userId });

				const mockKey = 'mockKey';
				const mockSecret = 'mockSecret';
				const ltiMessageType = LtiMessageType.BASIC_LTI_LAUNCH_REQUEST;
				const launchPresentationLocale = 'de-DE';

				const externalTool = externalToolFactory
					.withLti11Config({
						key: mockKey,
						secret: mockSecret,
						lti_message_type: ltiMessageType,
						privacy_permission: LtiPrivacyPermission.PUBLIC,
						launch_presentation_locale: launchPresentationLocale,
					})
					.build();

				const schoolExternalTool = schoolExternalToolFactory.build({ toolId: externalTool.id });

				const contextExternalToolId = 'contextExternalToolId';
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
					id: contextExternalToolId,
					schoolToolRef: {
						schoolToolId: schoolExternalTool.id,
						schoolId: schoolExternalTool.schoolId,
					},
					contextRef: {
						type: ToolContextType.COURSE,
					},
				});

				const data: ToolLaunchParams = {
					contextExternalTool,
					schoolExternalTool,
					externalTool,
				};

				const property1: PropertyData = new PropertyData({
					name: 'param1',
					value: 'value1',
					location: PropertyLocation.BODY,
				});

				const property2: PropertyData = new PropertyData({
					name: 'param2',
					value: 'value2',
					location: PropertyLocation.BODY,
				});

				const signedPayload: Authorization = {
					oauth_consumer_key: 'mockKey',
					oauth_nonce: 'nonce',
					oauth_signature: 'signature',
					oauth_signature_method: 'HMAC-SHA1',
					oauth_timestamp: 1,
					oauth_version: '1.0',
					[property1.name]: property1.value,
					[property2.name]: property2.value,
				};

				const toolLaunchRequest: ToolLaunchRequest = new ToolLaunchRequest({
					method: LaunchRequestMethod.POST,
					url: 'https://www.lti11-baseurl.com/',
					payload: JSON.stringify(signedPayload),
					openNewTab: false,
					isDeepLink: false,
				});

				userService.findById.mockResolvedValue(user);
				const decrypted = 'decryptedSecret';
				encryptionService.decrypt.mockReturnValue(decrypted);

				return {
					toolLaunchRequest,
					data,
					userId,
				};
			};

			it('should create a LaunchRequest with the correct method, url and payload', async () => {
				const { toolLaunchRequest, data, userId } = setup();

				const result: ToolLaunchRequest = await strategy.createLaunchRequest(userId, data);

				expect(result).toEqual<ToolLaunchRequest>(toolLaunchRequest);
			});
		});
	});
});
