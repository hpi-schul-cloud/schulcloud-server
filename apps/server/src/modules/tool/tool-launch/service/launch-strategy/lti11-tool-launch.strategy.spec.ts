import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import { ObjectId } from '@mikro-orm/mongodb';
import { PseudonymService } from '@modules/pseudonym/service';
import { pseudonymFactory } from '@modules/pseudonym/testing';
import { RoleName } from '@modules/role';
import { UserService } from '@modules/user';
import { userDoFactory } from '@modules/user/testing';
import { InternalServerErrorException, UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Authorization } from 'oauth-1.0a';
import { CustomParameterEntry } from '../../../common/domain';
import { LtiMessageType, LtiPrivacyPermission, LtiRole, ToolContextType } from '../../../common/enum';
import { Lti11EncryptionService } from '../../../common/service';
import {
	ContextExternalTool,
	LtiMessageTypeNotImplementedLoggableException,
} from '../../../context-external-tool/domain';
import { LtiDeepLinkingService, LtiDeepLinkTokenService } from '../../../context-external-tool/service';
import {
	contextExternalToolFactory,
	ltiDeepLinkFactory,
	ltiDeepLinkTokenFactory,
} from '../../../context-external-tool/testing';
import { externalToolFactory } from '../../../external-tool/testing';
import { SchoolExternalTool } from '../../../school-external-tool/domain';
import { schoolExternalToolFactory } from '../../../school-external-tool/testing';
import { TOOL_CONFIG_TOKEN, ToolConfig } from '../../../tool-config';
import { LaunchRequestMethod, LaunchType, PropertyData, PropertyLocation, ToolLaunchRequest } from '../../types';
import {
	AutoContextIdStrategy,
	AutoContextNameStrategy,
	AutoGroupExternalUuidStrategy,
	AutoMediumIdStrategy,
	AutoPublisherStrategy,
	AutoSchoolIdStrategy,
	AutoSchoolNumberStrategy,
} from '../auto-parameter-strategy';
import { Lti11ToolLaunchStrategy } from './lti11-tool-launch.strategy';

describe(Lti11ToolLaunchStrategy.name, () => {
	let module: TestingModule;
	let strategy: Lti11ToolLaunchStrategy;

	let userService: DeepMocked<UserService>;
	let pseudonymService: DeepMocked<PseudonymService>;
	let lti11EncryptionService: DeepMocked<Lti11EncryptionService>;
	let ltiDeepLinkTokenService: DeepMocked<LtiDeepLinkTokenService>;
	let ltiDeepLinkingService: DeepMocked<LtiDeepLinkingService>;
	let encryptionService: DeepMocked<EncryptionService>;
	let config: ToolConfig;

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
					provide: LtiDeepLinkTokenService,
					useValue: createMock<LtiDeepLinkTokenService>(),
				},
				{
					provide: LtiDeepLinkingService,
					useValue: createMock<LtiDeepLinkingService>(),
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
					provide: AutoPublisherStrategy,
					useValue: createMock<AutoPublisherStrategy>(),
				},
				{
					provide: AutoGroupExternalUuidStrategy,
					useValue: createMock<AutoGroupExternalUuidStrategy>(),
				},
				{
					provide: DefaultEncryptionService,
					useValue: createMock<EncryptionService>(),
				},
				{
					provide: TOOL_CONFIG_TOKEN,
					useValue: new ToolConfig(),
				},
			],
		}).compile();

		strategy = module.get(Lti11ToolLaunchStrategy);

		userService = module.get(UserService);
		pseudonymService = module.get(PseudonymService);
		lti11EncryptionService = module.get(Lti11EncryptionService);
		ltiDeepLinkTokenService = module.get(LtiDeepLinkTokenService);
		ltiDeepLinkingService = module.get(LtiDeepLinkingService);
		encryptionService = module.get(DefaultEncryptionService);
		config = module.get(TOOL_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('buildToolLaunchDataFromConcreteConfig', () => {
		describe('when lti messageType is basic lti launch request', () => {
			describe('when building the launch data for the encryption', () => {
				const setup = () => {
					const mockKey = 'mockKey';
					const mockSecret = 'mockSecret';
					const launchPresentationLocale = 'de-DE';

					const externalTool = externalToolFactory
						.withLti11Config({
							key: mockKey,
							secret: mockSecret,
							lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
							privacy_permission: LtiPrivacyPermission.PUBLIC,
							launch_presentation_locale: launchPresentationLocale,
						})
						.build();
					const schoolExternalTool = schoolExternalToolFactory.build();
					const contextExternalTool = contextExternalToolFactory.build();

					const data = {
						contextExternalTool,
						schoolExternalTool,
						externalTool,
					};

					const user = userDoFactory.buildWithId({
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
						contextExternalTool,
						launchPresentationLocale,
					};
				};

				it('should contain lti key and secret without location', async () => {
					const { data, mockKey, decrypted } = setup();

					const result = await strategy.buildToolLaunchDataFromConcreteConfig('userId', data);

					expect(result).toEqual(
						expect.arrayContaining([
							new PropertyData({ name: 'key', value: mockKey }),
							new PropertyData({ name: 'secret', value: decrypted }),
						])
					);
				});

				it('should contain mandatory lti attributes', async () => {
					const { data, contextExternalTool, launchPresentationLocale } = setup();

					const result = await strategy.buildToolLaunchDataFromConcreteConfig('userId', data);

					expect(result).toEqual(
						expect.arrayContaining([
							new PropertyData({
								name: 'lti_message_type',
								value: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
								location: PropertyLocation.BODY,
							}),
							new PropertyData({ name: 'lti_version', value: 'LTI-1p0', location: PropertyLocation.BODY }),
							new PropertyData({
								name: 'resource_link_id',
								value: contextExternalTool.id,
								location: PropertyLocation.BODY,
							}),
							new PropertyData({
								name: 'launch_presentation_document_target',
								value: 'window',
								location: PropertyLocation.BODY,
							}),
							new PropertyData({
								name: 'launch_presentation_locale',
								value: launchPresentationLocale,
								location: PropertyLocation.BODY,
							}),
						])
					);
				});
			});

			describe('when lti privacyPermission is public', () => {
				const setup = () => {
					const externalTool = externalToolFactory
						.withLti11Config({
							key: 'mockKey',
							secret: 'mockSecret',
							lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
							privacy_permission: LtiPrivacyPermission.PUBLIC,
						})
						.build();
					const schoolExternalTool = schoolExternalToolFactory.build();
					const contextExternalTool = contextExternalToolFactory.build();

					const data = {
						contextExternalTool,
						schoolExternalTool,
						externalTool,
					};

					const userId = new ObjectId().toHexString();
					const userEmail = 'user@email.com';
					const user = userDoFactory.buildWithId(
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

					const result = await strategy.buildToolLaunchDataFromConcreteConfig(userId, data);

					expect(result).toEqual(
						expect.arrayContaining([
							new PropertyData({
								name: 'roles',
								value: `${LtiRole.INSTRUCTOR},${LtiRole.LEARNER}`,
								location: PropertyLocation.BODY,
							}),
							new PropertyData({
								name: 'lis_person_name_full',
								value: userDisplayName,
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
				});
			});

			describe('when lti privacyPermission is name', () => {
				const setup = () => {
					const externalTool = externalToolFactory
						.withLti11Config({
							key: 'mockKey',
							secret: 'mockSecret',
							lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
							privacy_permission: LtiPrivacyPermission.NAME,
						})
						.build();
					const schoolExternalTool = schoolExternalToolFactory.build();
					const contextExternalTool = contextExternalToolFactory.build();

					const data = {
						contextExternalTool,
						schoolExternalTool,
						externalTool,
					};

					const userId = new ObjectId().toHexString();
					const user = userDoFactory.buildWithId(
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

					const result = await strategy.buildToolLaunchDataFromConcreteConfig(userId, data);

					expect(result).toEqual(
						expect.arrayContaining([
							new PropertyData({
								name: 'roles',
								value: `${LtiRole.INSTRUCTOR},${LtiRole.LEARNER}`,
								location: PropertyLocation.BODY,
							}),
							new PropertyData({
								name: 'lis_person_name_full',
								value: userDisplayName,
								location: PropertyLocation.BODY,
							}),
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
					const externalTool = externalToolFactory
						.withLti11Config({
							key: 'mockKey',
							secret: 'mockSecret',
							lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
							privacy_permission: LtiPrivacyPermission.EMAIL,
						})
						.build();
					const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
					const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build();

					const data = {
						contextExternalTool,
						schoolExternalTool,
						externalTool,
					};

					const userId = new ObjectId().toHexString();
					const userEmail = 'user@email.com';
					const user = userDoFactory.buildWithId(
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

					const result = await strategy.buildToolLaunchDataFromConcreteConfig(userId, data);

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
					expect(result).not.toEqual(
						expect.arrayContaining([expect.objectContaining({ name: 'lis_person_name_full' })])
					);
				});
			});

			describe('when lti privacyPermission is pseudonymous', () => {
				const setup = () => {
					const externalTool = externalToolFactory
						.withLti11Config({
							key: 'mockKey',
							secret: 'mockSecret',
							lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
							privacy_permission: LtiPrivacyPermission.PSEUDONYMOUS,
						})
						.build();
					const schoolExternalTool = schoolExternalToolFactory.build();
					const contextExternalTool = contextExternalToolFactory.build();

					const data = {
						contextExternalTool,
						schoolExternalTool,
						externalTool,
					};

					const user = userDoFactory.buildWithId({
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

					const pseudonym = pseudonymFactory.build();

					userService.findById.mockResolvedValue(user);
					pseudonymService.findOrCreatePseudonym.mockResolvedValue(pseudonym);

					return {
						data,
						pseudonym,
					};
				};

				it('should contain the pseudonymised user id', async () => {
					const { data, pseudonym } = setup();

					const result = await strategy.buildToolLaunchDataFromConcreteConfig('userId', data);

					expect(result).toEqual(
						expect.arrayContaining([
							new PropertyData({
								name: 'roles',
								value: `${LtiRole.INSTRUCTOR},${LtiRole.LEARNER}`,
								location: PropertyLocation.BODY,
							}),
							new PropertyData({
								name: 'user_id',
								value: pseudonym.pseudonym,
								location: PropertyLocation.BODY,
							}),
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
					const externalTool = externalToolFactory
						.withLti11Config({
							key: 'mockKey',
							secret: 'mockSecret',
							lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
							privacy_permission: LtiPrivacyPermission.ANONYMOUS,
						})
						.build();
					const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
					const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build();

					const data = {
						contextExternalTool,
						schoolExternalTool,
						externalTool,
					};

					const user = userDoFactory.buildWithId({
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

					const result = await strategy.buildToolLaunchDataFromConcreteConfig('userId', data);

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

			describe('when context external tool id is undefined', () => {
				const setup = () => {
					const externalTool = externalToolFactory
						.withLti11Config({
							key: 'mockKey',
							secret: 'mockSecret',
							lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
							privacy_permission: LtiPrivacyPermission.ANONYMOUS,
						})
						.build();
					const schoolExternalTool = schoolExternalToolFactory.build();
					const pseudoContextExternalTool = {
						...contextExternalToolFactory.build().getProps(),
						id: undefined,
					};

					const data = {
						contextExternalTool: pseudoContextExternalTool,
						schoolExternalTool,
						externalTool,
					};

					const user = userDoFactory.buildWithId({
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
		});

		describe('when lti messageType is content item selection request', () => {
			describe('when no content is linked to the tool', () => {
				const setup = () => {
					const externalTool = externalToolFactory
						.withLti11Config({
							key: 'mockKey',
							secret: 'mockSecret',
							lti_message_type: LtiMessageType.CONTENT_ITEM_SELECTION_REQUEST,
							privacy_permission: LtiPrivacyPermission.ANONYMOUS,
						})
						.build();
					const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
					const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build();

					const data = {
						contextExternalTool,
						schoolExternalTool,
						externalTool,
					};

					const userId = new ObjectId().toHexString();
					const user = userDoFactory.buildWithId(undefined, userId);
					const ltiDeepLinkToken = ltiDeepLinkTokenFactory.build();

					const { publicBackendUrl } = config;
					const callbackUrl = `${publicBackendUrl}/v3/tools/context-external-tools/${contextExternalTool.id}/lti11-deep-link-callback`;

					userService.findById.mockResolvedValue(user);
					const decrypted = 'decryptedSecret';
					encryptionService.decrypt.mockReturnValue(decrypted);
					ltiDeepLinkingService.getCallbackUrl.mockReturnValueOnce(callbackUrl);
					ltiDeepLinkTokenService.generateToken.mockResolvedValueOnce(ltiDeepLinkToken);

					return {
						data,
						userId,
						callbackUrl,
						ltiDeepLinkToken,
					};
				};

				it('should contain the attributes for a content item selection request', async () => {
					const { data, userId, callbackUrl, ltiDeepLinkToken } = setup();

					const result = await strategy.buildToolLaunchDataFromConcreteConfig(userId, data);

					expect(result).toEqual(
						expect.arrayContaining([
							new PropertyData({ name: 'key', value: 'mockKey' }),
							new PropertyData({ name: 'secret', value: 'decryptedSecret' }),
							new PropertyData({
								name: 'lti_message_type',
								value: LtiMessageType.CONTENT_ITEM_SELECTION_REQUEST,
								location: PropertyLocation.BODY,
							}),
							new PropertyData({
								name: 'lti_version',
								value: 'LTI-1p0',
								location: PropertyLocation.BODY,
							}),
							new PropertyData({
								name: 'resource_link_id',
								value: data.contextExternalTool.id,
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
								value: ltiDeepLinkToken.state,
								location: PropertyLocation.BODY,
							}),
						])
					);
				});
			});

			describe('when the linked content is an lti launch', () => {
				const setup = () => {
					const launchPresentationLocale = 'de-DE';

					const externalTool = externalToolFactory
						.withLti11Config({
							key: 'mockKey',
							secret: 'mockSecret',
							lti_message_type: LtiMessageType.CONTENT_ITEM_SELECTION_REQUEST,
							privacy_permission: LtiPrivacyPermission.ANONYMOUS,
							launch_presentation_locale: launchPresentationLocale,
						})
						.build();
					const schoolExternalTool = schoolExternalToolFactory.build();
					const ltiDeepLinkParameter = new CustomParameterEntry({ name: 'dl_param', value: 'dl_value' });
					const ltiDeepLink = ltiDeepLinkFactory.build({
						mediaType: 'application/vnd.ims.lti.v1.ltilink',
						parameters: [ltiDeepLinkParameter],
					});
					const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
						ltiDeepLink,
					});

					const data = {
						contextExternalTool,
						schoolExternalTool,
						externalTool,
					};

					const userId = new ObjectId().toHexString();
					const user = userDoFactory.buildWithId(undefined, userId);

					userService.findById.mockResolvedValue(user);
					const decrypted = 'decryptedSecret';
					encryptionService.decrypt.mockReturnValue(decrypted);

					return {
						data,
						userId,
						contextExternalTool,
						launchPresentationLocale,
						ltiDeepLinkParameter,
					};
				};

				it('should contain the attributes for a basic lti launch request with the additional attributes from the deep link', async () => {
					const { data, userId, contextExternalTool, launchPresentationLocale, ltiDeepLinkParameter } = setup();

					const result = await strategy.buildToolLaunchDataFromConcreteConfig(userId, data);

					expect(result).toEqual(
						expect.arrayContaining([
							new PropertyData({
								name: 'lti_message_type',
								value: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
								location: PropertyLocation.BODY,
							}),
							new PropertyData({ name: 'lti_version', value: 'LTI-1p0', location: PropertyLocation.BODY }),
							new PropertyData({
								name: 'resource_link_id',
								value: contextExternalTool.id,
								location: PropertyLocation.BODY,
							}),
							new PropertyData({
								name: 'launch_presentation_document_target',
								value: 'window',
								location: PropertyLocation.BODY,
							}),
							new PropertyData({
								name: 'launch_presentation_locale',
								value: launchPresentationLocale,
								location: PropertyLocation.BODY,
							}),
							new PropertyData({
								name: `custom_${ltiDeepLinkParameter.name}`,
								value: ltiDeepLinkParameter.value as string,
								location: PropertyLocation.BODY,
							}),
						])
					);
				});
			});

			describe('when the linked content does not require an lti launch', () => {
				const setup = () => {
					const externalTool = externalToolFactory
						.withLti11Config({
							key: 'mockKey',
							secret: 'mockSecret',
							lti_message_type: LtiMessageType.CONTENT_ITEM_SELECTION_REQUEST,
							privacy_permission: LtiPrivacyPermission.ANONYMOUS,
						})
						.build();
					const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
					const ltiDeepLink = ltiDeepLinkFactory.build({
						mediaType: 'application/pdf',
						parameters: undefined,
					});
					const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
						ltiDeepLink,
					});

					const data = {
						contextExternalTool,
						schoolExternalTool,
						externalTool,
					};

					const userId = new ObjectId().toHexString();
					const user = userDoFactory.buildWithId(undefined, userId);

					userService.findById.mockResolvedValue(user);
					const decrypted = 'decryptedSecret';
					encryptionService.decrypt.mockReturnValue(decrypted);

					return {
						data,
						userId,
						contextExternalTool,
					};
				};

				it('should not contain parameters', async () => {
					const { data, userId } = setup();

					const result = await strategy.buildToolLaunchDataFromConcreteConfig(userId, data);

					expect(result).toEqual([]);
				});
			});

			describe('when the tool is not permanent', () => {
				const setup = () => {
					const externalTool = externalToolFactory
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

					const data = {
						contextExternalTool: pseudoContextExternalTool,
						schoolExternalTool,
						externalTool,
					};

					const userId = new ObjectId().toHexString();
					const user = userDoFactory.buildWithId(undefined, userId);

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

		describe('when the lti message type is unknown', () => {
			const setup = () => {
				const externalTool = externalToolFactory
					.withLti11Config({
						lti_message_type: 'unknown' as unknown as LtiMessageType,
					})
					.build();
				const schoolExternalTool = schoolExternalToolFactory.build();
				const contextExternalTool = contextExternalToolFactory.build();

				const data = {
					contextExternalTool,
					schoolExternalTool,
					externalTool,
				};

				const userId = new ObjectId().toHexString();

				return {
					data,
					userId,
					contextExternalTool,
				};
			};

			it('should throw an error', async () => {
				const { data, userId } = setup();

				await expect(() => strategy.buildToolLaunchDataFromConcreteConfig(userId, data)).rejects.toThrow(
					LtiMessageTypeNotImplementedLoggableException
				);
			});
		});

		describe('when tool config is not lti', () => {
			const setup = () => {
				const externalTool = externalToolFactory.build();
				const schoolExternalTool = schoolExternalToolFactory.build();
				const contextExternalTool = contextExternalToolFactory.build();

				const data = {
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
	});

	describe('buildToolLaunchRequestPayload', () => {
		describe('when key and secret are provided', () => {
			const setup = () => {
				const property1 = new PropertyData({
					name: 'param1',
					value: 'value1',
					location: PropertyLocation.BODY,
				});

				const property2 = new PropertyData({
					name: 'param2',
					value: 'value2',
					location: PropertyLocation.BODY,
				});

				const property3 = new PropertyData({
					name: 'param2',
					value: 'value2',
					location: PropertyLocation.PATH,
				});

				const mockKey = 'mockKey';
				const keyProperty = new PropertyData({
					name: 'key',
					value: mockKey,
				});

				const secretProperty = new PropertyData({
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

				const payload = strategy.buildToolLaunchRequestPayload('url', properties);

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
				const property1 = new PropertyData({
					name: 'param1',
					value: 'value1',
					location: PropertyLocation.BODY,
				});

				const property2 = new PropertyData({
					name: 'param2',
					value: 'value2',
					location: PropertyLocation.BODY,
				});

				const property3 = new PropertyData({
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
			const result = strategy.determineLaunchRequestMethod([]);

			expect(result).toEqual(LaunchRequestMethod.POST);
		});
	});

	describe('createLaunchRequest', () => {
		describe('when lti message type is content item selection request and no content is selected', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const user = userDoFactory.buildWithId({ id: userId });

				const externalTool = externalToolFactory
					.withLti11Config({
						key: 'mockKey',
						secret: 'mockSecret',
						lti_message_type: LtiMessageType.CONTENT_ITEM_SELECTION_REQUEST,
						privacy_permission: LtiPrivacyPermission.ANONYMOUS,
					})
					.build({
						openNewTab: false,
					});

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

				const data = {
					contextExternalTool,
					schoolExternalTool,
					externalTool,
				};

				const property1 = new PropertyData({
					name: 'param1',
					value: 'value1',
					location: PropertyLocation.BODY,
				});

				const property2 = new PropertyData({
					name: 'param2',
					value: 'value2',
					location: PropertyLocation.BODY,
				});

				const signedPayload = {
					oauth_consumer_key: 'mockKey',
					oauth_nonce: 'nonce',
					oauth_signature: 'signature',
					oauth_signature_method: 'HMAC-SHA1',
					oauth_timestamp: 1,
					oauth_version: '1.0',
					[property1.name]: property1.value,
					[property2.name]: property2.value,
				};

				userService.findById.mockResolvedValue(user);
				const decrypted = 'decryptedSecret';
				encryptionService.decrypt.mockReturnValue(decrypted);
				lti11EncryptionService.sign.mockReturnValueOnce(signedPayload);

				return {
					signedPayload,
					data,
					userId,
				};
			};

			it('should create a post request with a signed payload and open in a new tab', async () => {
				const { signedPayload, data, userId } = setup();

				const result = await strategy.createLaunchRequest(userId, data);

				expect(result).toEqual<ToolLaunchRequest>({
					method: LaunchRequestMethod.POST,
					url: 'https://www.lti11-baseurl.com/',
					payload: JSON.stringify(signedPayload),
					openNewTab: true,
					launchType: LaunchType.LTI11_CONTENT_ITEM_SELECTION,
				});
			});
		});

		describe('when there is a deep link with a url', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const user = userDoFactory.buildWithId({ id: userId });

				const externalTool = externalToolFactory
					.withLti11Config({
						key: 'mockKey',
						secret: 'mockSecret',
						lti_message_type: LtiMessageType.CONTENT_ITEM_SELECTION_REQUEST,
						privacy_permission: LtiPrivacyPermission.ANONYMOUS,
					})
					.build({
						openNewTab: false,
					});

				const schoolExternalTool = schoolExternalToolFactory.build({ toolId: externalTool.id });
				const ltiDeepLink = ltiDeepLinkFactory.build({
					mediaType: 'application/vnd.ims.lti.v1.ltilink',
					url: 'https://lti.deep.link',
				});

				const contextExternalToolId = 'contextExternalToolId';
				const contextExternalTool = contextExternalToolFactory.build({
					id: contextExternalToolId,
					schoolToolRef: {
						schoolToolId: schoolExternalTool.id,
						schoolId: schoolExternalTool.schoolId,
					},
					contextRef: {
						type: ToolContextType.COURSE,
					},
					ltiDeepLink,
				});

				const data = {
					contextExternalTool,
					schoolExternalTool,
					externalTool,
				};

				const property1 = new PropertyData({
					name: 'param1',
					value: 'value1',
					location: PropertyLocation.BODY,
				});

				const property2 = new PropertyData({
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

				userService.findById.mockResolvedValue(user);
				const decrypted = 'decryptedSecret';
				encryptionService.decrypt.mockReturnValue(decrypted);
				lti11EncryptionService.sign.mockReturnValueOnce(signedPayload);

				return {
					signedPayload,
					data,
					userId,
					ltiDeepLink,
				};
			};

			it('should use the deep link url', async () => {
				const { signedPayload, data, userId, ltiDeepLink } = setup();

				const result = await strategy.createLaunchRequest(userId, data);

				expect(result).toEqual<ToolLaunchRequest>({
					method: LaunchRequestMethod.POST,
					url: ltiDeepLink.url as string,
					payload: JSON.stringify(signedPayload),
					openNewTab: false,
					launchType: LaunchType.LTI11_BASIC_LAUNCH,
				});
			});
		});

		describe('when there is a deep link resource that does not require an lti launch', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const user = userDoFactory.buildWithId({ id: userId });

				const externalTool = externalToolFactory
					.withLti11Config({
						key: 'mockKey',
						secret: 'mockSecret',
						lti_message_type: LtiMessageType.CONTENT_ITEM_SELECTION_REQUEST,
						privacy_permission: LtiPrivacyPermission.ANONYMOUS,
					})
					.build({
						openNewTab: false,
					});

				const schoolExternalTool = schoolExternalToolFactory.build({ toolId: externalTool.id });
				const ltiDeepLink = ltiDeepLinkFactory.build({
					mediaType: 'application/pdf',
					url: undefined,
				});

				const contextExternalToolId = 'contextExternalToolId';
				const contextExternalTool = contextExternalToolFactory.build({
					id: contextExternalToolId,
					schoolToolRef: {
						schoolToolId: schoolExternalTool.id,
						schoolId: schoolExternalTool.schoolId,
					},
					contextRef: {
						type: ToolContextType.COURSE,
					},
					ltiDeepLink,
				});

				const data = {
					contextExternalTool,
					schoolExternalTool,
					externalTool,
				};

				userService.findById.mockResolvedValue(user);
				const decrypted = 'decryptedSecret';
				encryptionService.decrypt.mockReturnValue(decrypted);

				return {
					data,
					userId,
					ltiDeepLink,
				};
			};

			it('should use the GET method without a payload', async () => {
				const { data, userId } = setup();

				const result = await strategy.createLaunchRequest(userId, data);

				expect(result).toEqual<ToolLaunchRequest>({
					method: LaunchRequestMethod.GET,
					url: 'https://www.lti11-baseurl.com/',
					payload: undefined,
					openNewTab: false,
					launchType: LaunchType.BASIC,
				});
			});
		});

		describe('when there is a deep link resource of type lti assignment', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const user = userDoFactory.buildWithId({ id: userId });

				const externalTool = externalToolFactory
					.withLti11Config({
						key: 'mockKey',
						secret: 'mockSecret',
						lti_message_type: LtiMessageType.CONTENT_ITEM_SELECTION_REQUEST,
						privacy_permission: LtiPrivacyPermission.ANONYMOUS,
					})
					.build({
						openNewTab: false,
					});

				const schoolExternalTool = schoolExternalToolFactory.build({ toolId: externalTool.id });
				const ltiDeepLink = ltiDeepLinkFactory.build({
					mediaType: 'application/vnd.ims.lti.v1.ltiassignment',
					url: undefined,
				});

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
					ltiDeepLink,
				});

				const data = {
					contextExternalTool,
					schoolExternalTool,
					externalTool,
				};

				const property1 = new PropertyData({
					name: 'param1',
					value: 'value1',
					location: PropertyLocation.BODY,
				});

				const property2 = new PropertyData({
					name: 'param2',
					value: 'value2',
					location: PropertyLocation.BODY,
				});

				const signedPayload = {
					oauth_consumer_key: 'mockKey',
					oauth_nonce: 'nonce',
					oauth_signature: 'signature',
					oauth_signature_method: 'HMAC-SHA1',
					oauth_timestamp: 1,
					oauth_version: '1.0',
					[property1.name]: property1.value,
					[property2.name]: property2.value,
				};

				userService.findById.mockResolvedValue(user);
				const decrypted = 'decryptedSecret';
				encryptionService.decrypt.mockReturnValue(decrypted);
				lti11EncryptionService.sign.mockReturnValueOnce(signedPayload);

				return {
					signedPayload,
					data,
					userId,
					ltiDeepLink,
				};
			};

			it('should create a post request with a signed payload', async () => {
				const { signedPayload, data, userId } = setup();

				const result = await strategy.createLaunchRequest(userId, data);

				expect(result).toEqual<ToolLaunchRequest>({
					method: LaunchRequestMethod.POST,
					url: 'https://www.lti11-baseurl.com/',
					payload: JSON.stringify(signedPayload),
					openNewTab: false,
					launchType: LaunchType.LTI11_BASIC_LAUNCH,
				});
			});
		});

		describe('when there is a deep link resource of type lti link', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const user = userDoFactory.buildWithId({ id: userId });

				const externalTool = externalToolFactory
					.withLti11Config({
						key: 'mockKey',
						secret: 'mockSecret',
						lti_message_type: LtiMessageType.CONTENT_ITEM_SELECTION_REQUEST,
						privacy_permission: LtiPrivacyPermission.ANONYMOUS,
					})
					.build({
						openNewTab: false,
					});

				const schoolExternalTool = schoolExternalToolFactory.build({ toolId: externalTool.id });
				const ltiDeepLink = ltiDeepLinkFactory.build({
					mediaType: 'application/vnd.ims.lti.v1.ltilink',
					url: undefined,
				});

				const contextExternalToolId = 'contextExternalToolId';
				const contextExternalTool = contextExternalToolFactory.build({
					id: contextExternalToolId,
					schoolToolRef: {
						schoolToolId: schoolExternalTool.id,
						schoolId: schoolExternalTool.schoolId,
					},
					contextRef: {
						type: ToolContextType.COURSE,
					},
					ltiDeepLink,
				});

				const data = {
					contextExternalTool,
					schoolExternalTool,
					externalTool,
				};

				const property1 = new PropertyData({
					name: 'param1',
					value: 'value1',
					location: PropertyLocation.BODY,
				});

				const property2 = new PropertyData({
					name: 'param2',
					value: 'value2',
					location: PropertyLocation.BODY,
				});

				const signedPayload = {
					oauth_consumer_key: 'mockKey',
					oauth_nonce: 'nonce',
					oauth_signature: 'signature',
					oauth_signature_method: 'HMAC-SHA1',
					oauth_timestamp: 1,
					oauth_version: '1.0',
					[property1.name]: property1.value,
					[property2.name]: property2.value,
				};

				userService.findById.mockResolvedValue(user);
				const decrypted = 'decryptedSecret';
				encryptionService.decrypt.mockReturnValue(decrypted);
				lti11EncryptionService.sign.mockReturnValueOnce(signedPayload);

				return {
					signedPayload,
					data,
					userId,
					ltiDeepLink,
				};
			};

			it('should create a post request with a signed payload', async () => {
				const { signedPayload, data, userId } = setup();

				const result = await strategy.createLaunchRequest(userId, data);

				expect(result).toEqual<ToolLaunchRequest>({
					method: LaunchRequestMethod.POST,
					url: 'https://www.lti11-baseurl.com/',
					payload: JSON.stringify(signedPayload),
					openNewTab: false,
					launchType: LaunchType.LTI11_BASIC_LAUNCH,
				});
			});
		});

		describe('when lti message type is basic lti launch request', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const user = userDoFactory.buildWithId({ id: userId });

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
					.build({
						openNewTab: false,
					});

				const schoolExternalTool = schoolExternalToolFactory.build({ toolId: externalTool.id });

				const contextExternalToolId = 'contextExternalToolId';
				const contextExternalTool = contextExternalToolFactory.build({
					id: contextExternalToolId,
					schoolToolRef: {
						schoolToolId: schoolExternalTool.id,
						schoolId: schoolExternalTool.schoolId,
					},
					contextRef: {
						type: ToolContextType.COURSE,
					},
				});

				const data = {
					contextExternalTool,
					schoolExternalTool,
					externalTool,
				};

				const property1 = new PropertyData({
					name: 'param1',
					value: 'value1',
					location: PropertyLocation.BODY,
				});

				const property2 = new PropertyData({
					name: 'param2',
					value: 'value2',
					location: PropertyLocation.BODY,
				});

				const signedPayload = {
					oauth_consumer_key: 'mockKey',
					oauth_nonce: 'nonce',
					oauth_signature: 'signature',
					oauth_signature_method: 'HMAC-SHA1',
					oauth_timestamp: 1,
					oauth_version: '1.0',
					[property1.name]: property1.value,
					[property2.name]: property2.value,
				};

				userService.findById.mockResolvedValue(user);
				const decrypted = 'decryptedSecret';
				encryptionService.decrypt.mockReturnValue(decrypted);
				lti11EncryptionService.sign.mockReturnValueOnce(signedPayload);

				return {
					signedPayload,
					data,
					userId,
				};
			};

			it('should create a post request with a signed payload', async () => {
				const { signedPayload, data, userId } = setup();

				const result = await strategy.createLaunchRequest(userId, data);

				expect(result).toEqual<ToolLaunchRequest>({
					method: LaunchRequestMethod.POST,
					url: 'https://www.lti11-baseurl.com/',
					payload: JSON.stringify(signedPayload),
					openNewTab: false,
					launchType: LaunchType.LTI11_BASIC_LAUNCH,
				});
			});
		});
	});

	describe('determineLaunchType', () => {
		describe('whenever it is called', () => {
			it('should return lti basic launch', () => {
				const result = strategy.determineLaunchType();

				expect(result).toEqual(LaunchType.LTI11_BASIC_LAUNCH);
			});
		});
	});
});
