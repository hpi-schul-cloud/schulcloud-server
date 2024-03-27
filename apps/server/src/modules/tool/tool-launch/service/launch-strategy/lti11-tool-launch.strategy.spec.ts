import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { PseudonymService } from '@modules/pseudonym/service';
import { UserService } from '@modules/user';
import { InternalServerErrorException, UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Pseudonym, UserDO } from '@shared/domain/domainobject';
import { RoleName } from '@shared/domain/interface';
import {
	contextExternalToolFactory,
	externalToolFactory,
	schoolExternalToolFactory,
	userDoFactory,
} from '@shared/testing';
import { pseudonymFactory } from '@shared/testing/factory/domainobject/pseudonym.factory';
import { ObjectId } from '@mikro-orm/mongodb';
import { Authorization } from 'oauth-1.0a';
import { LtiMessageType, LtiPrivacyPermission, LtiRole } from '../../../common/enum';
import { ContextExternalTool } from '../../../context-external-tool/domain';
import { ExternalTool } from '../../../external-tool/domain';
import { SchoolExternalTool } from '../../../school-external-tool/domain';
import { LaunchRequestMethod, PropertyData, PropertyLocation } from '../../types';
import {
	AutoContextIdStrategy,
	AutoContextNameStrategy,
	AutoSchoolIdStrategy,
	AutoSchoolNumberStrategy,
} from '../auto-parameter-strategy';
import { AutoMediumIdStrategy } from '../auto-parameter-strategy/auto-medium-id.strategy';
import { Lti11EncryptionService } from '../lti11-encryption.service';
import { Lti11ToolLaunchStrategy } from './lti11-tool-launch.strategy';
import { ToolLaunchParams } from './tool-launch-params.interface';

describe('Lti11ToolLaunchStrategy', () => {
	let module: TestingModule;
	let strategy: Lti11ToolLaunchStrategy;

	let userService: DeepMocked<UserService>;
	let pseudonymService: DeepMocked<PseudonymService>;
	let lti11EncryptionService: DeepMocked<Lti11EncryptionService>;

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
			],
		}).compile();

		strategy = module.get(Lti11ToolLaunchStrategy);

		userService = module.get(UserService);
		pseudonymService = module.get(PseudonymService);
		lti11EncryptionService = module.get(Lti11EncryptionService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('buildToolLaunchDataFromConcreteConfig', () => {
		describe('when building the launch data', () => {
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
					.buildWithId();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId();

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
					user,
					mockKey,
					mockSecret,
					ltiMessageType,
					contextExternalTool,
					launchPresentationLocale,
				};
			};

			it('should contain lti key and secret without location', async () => {
				const { data, mockKey, mockSecret } = setup();

				const result: PropertyData[] = await strategy.buildToolLaunchDataFromConcreteConfig('userId', data);

				expect(result).toEqual(
					expect.arrayContaining([
						new PropertyData({ name: 'key', value: mockKey }),
						new PropertyData({ name: 'secret', value: mockSecret }),
					])
				);
			});

			it('should contain mandatory lti attributes', async () => {
				const { data, ltiMessageType, contextExternalTool, launchPresentationLocale } = setup();

				const result: PropertyData[] = await strategy.buildToolLaunchDataFromConcreteConfig('userId', data);

				expect(result).toEqual(
					expect.arrayContaining([
						new PropertyData({ name: 'lti_message_type', value: ltiMessageType, location: PropertyLocation.BODY }),
						new PropertyData({ name: 'lti_version', value: 'LTI-1p0', location: PropertyLocation.BODY }),
						new PropertyData({
							name: 'resource_link_id',
							value: contextExternalTool.id as string,
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
				const externalTool: ExternalTool = externalToolFactory
					.withLti11Config({
						key: 'mockKey',
						secret: 'mockSecret',
						lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
						privacy_permission: LtiPrivacyPermission.PUBLIC,
					})
					.buildWithId();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId();

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

			it('should contain the all user related attributes', async () => {
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
					.buildWithId();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId();

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
					.buildWithId();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId();

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
					.buildWithId();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId();

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
					.buildWithId();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId();

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
				const externalTool: ExternalTool = externalToolFactory.buildWithId();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId();

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
					.buildWithId();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
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

			it('should throw an InternalServerErrorException', async () => {
				const { data } = setup();

				const func = async () => strategy.buildToolLaunchDataFromConcreteConfig('userId', data);

				await expect(func).rejects.toThrow(new InternalServerErrorException());
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
});
