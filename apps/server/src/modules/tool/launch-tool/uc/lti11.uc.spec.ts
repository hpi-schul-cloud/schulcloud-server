import { Test, TestingModule } from '@nestjs/testing';
import { LtiPrivacyPermission, RoleName } from '@shared/domain';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { LtiToolRepo } from '@shared/repo';
import { CustomLtiProperty, LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import OAuth, { Authorization, RequestOptions } from 'oauth-1.0a';
import { InternalServerErrorException } from '@nestjs/common';
import { UserService } from '../../../user/service/user.service';
import { LtiRole } from '../interface/lti-role.enum';
import { UserDto } from '../../../user/uc/dto/user.dto';
import { Lti11Service } from '../service/lti11.service';
import { LtiRoleMapper } from '../../uc/mapper';
import { Lti11Uc } from './lti11.uc';

describe('Lti11Uc', () => {
	let module: TestingModule;
	let useCase: Lti11Uc;

	let lti11Service: DeepMocked<Lti11Service>;
	let ltiRoleMapper: DeepMocked<LtiRoleMapper>;
	let ltiToolRepo: DeepMocked<LtiToolRepo>;
	let userService: DeepMocked<UserService>;

	const oauth: DeepMocked<OAuth> = createMock<OAuth>();

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				Lti11Uc,
				{
					provide: Lti11Service,
					useValue: createMock<Lti11Service>(),
				},
				{
					provide: LtiRoleMapper,
					useValue: createMock<LtiRoleMapper>(),
				},
				{
					provide: LtiToolRepo,
					useValue: createMock<LtiToolRepo>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
			],
		}).compile();

		useCase = module.get(Lti11Uc);
		lti11Service = module.get(Lti11Service);
		ltiRoleMapper = module.get(LtiRoleMapper);
		ltiToolRepo = module.get(LtiToolRepo);
		userService = module.get(UserService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getLaunchParameters', () => {
		describe('build oauth1 authorization parameters and payload', () => {
			const setup = () => {
				const userName = 'userName';
				const userId = 'userId';
				const userRole: RoleName = RoleName.USER;
				const userDto: UserDto = new UserDto({
					email: 'email',
					firstName: 'firstName',
					lastName: 'lastName',
					roleIds: ['roleId'],
					schoolId: 'schoolId',
				});
				const ltiTool: LtiToolDO = new LtiToolDO({
					name: 'name',
					url: 'url',
					key: 'key',
					secret: 'secret',
					roles: [],
					privacy_permission: LtiPrivacyPermission.PSEUDONYMOUS,
					customs: [],
					isTemplate: false,
					openNewTab: false,
					isHidden: false,
					lti_version: 'LTI-1p0',
					lti_message_type: 'messageType',
					resource_link_id: 'linkId',
				});
				const authorization: Authorization = {
					oauth_consumer_key: 'key',
					oauth_nonce: 'nonce',
					oauth_body_hash: 'body_hash',
					oauth_signature: 'signature',
					oauth_timestamp: 100,
					oauth_token: 'token',
					oauth_version: 'version',
					oauth_signature_method: 'signature_method',
				};

				ltiToolRepo.findById.mockResolvedValue(ltiTool);
				ltiRoleMapper.mapRoleToLtiRole.mockReturnValue(LtiRole.LEARNER);
				userService.getUser.mockResolvedValue(userDto);
				lti11Service.getUserIdOrPseudonym.mockResolvedValue(userId);
				userService.getDisplayName.mockResolvedValue(userName);
				lti11Service.createConsumer.mockReturnValue(oauth);
				oauth.authorize.mockReturnValue(authorization);

				return {
					userName,
					userId,
					userRole,
					userDto,
					ltiTool,
					authorization,
				};
			};

			it('should return authorization with resource link id from tool', async () => {
				const { userId, userRole, ltiTool, authorization } = setup();
				const expectedRequestData: RequestOptions = {
					url: ltiTool.url,
					method: 'POST',
					data: {
						lti_version: ltiTool.lti_version,
						lti_message_type: ltiTool.lti_message_type,
						resource_link_id: ltiTool.resource_link_id,
						roles: LtiRole.LEARNER,
						launch_presentation_document_target: 'window',
						launch_presentation_locale: 'en',
						user_id: userId,
					},
				};

				const result: Authorization = await useCase.getLaunchParameters(userId, userRole, 'toolId', 'courseId');

				expect(result).toEqual(authorization);
				expect(oauth.authorize).toHaveBeenCalledWith(expect.objectContaining(expectedRequestData));
			});

			it('should return authorization with courseId as resource_link_id, if tool has none', async () => {
				const { userId, userRole, ltiTool, authorization } = setup();
				const courseId = 'courseId';
				ltiTool.resource_link_id = undefined;
				const expectedRequestData: RequestOptions = {
					url: ltiTool.url,
					method: 'POST',
					data: {
						lti_version: ltiTool.lti_version,
						lti_message_type: ltiTool.lti_message_type,
						resource_link_id: courseId,
						roles: LtiRole.LEARNER,
						launch_presentation_document_target: 'window',
						launch_presentation_locale: 'en',
						user_id: userId,
					},
				};

				const result: Authorization = await useCase.getLaunchParameters(userId, userRole, 'toolId', courseId);

				expect(result).toEqual(authorization);
				expect(oauth.authorize).toHaveBeenCalledWith(expectedRequestData);
			});

			it('should return authorization with pseudonymous privacy_permission', async () => {
				const { userId, userRole, ltiTool, authorization } = setup();
				const expectedRequestData: RequestOptions = {
					url: ltiTool.url,
					method: 'POST',
					data: {
						lti_version: ltiTool.lti_version,
						lti_message_type: ltiTool.lti_message_type,
						resource_link_id: ltiTool.resource_link_id,
						roles: LtiRole.LEARNER,
						launch_presentation_document_target: 'window',
						launch_presentation_locale: 'en',
						user_id: userId,
					},
				};

				const result: Authorization = await useCase.getLaunchParameters(userId, userRole, 'toolId', 'courseId');

				expect(result).toEqual(authorization);
				expect(oauth.authorize).toHaveBeenCalledWith(expectedRequestData);
			});

			it('should return authorization with name privacy_permission', async () => {
				const { userId, userRole, ltiTool, authorization, userName } = setup();
				ltiTool.privacy_permission = LtiPrivacyPermission.NAME;
				const expectedRequestData: RequestOptions = {
					url: ltiTool.url,
					method: 'POST',
					data: {
						lti_version: ltiTool.lti_version,
						lti_message_type: ltiTool.lti_message_type,
						resource_link_id: ltiTool.resource_link_id,
						roles: LtiRole.LEARNER,
						launch_presentation_document_target: 'window',
						launch_presentation_locale: 'en',
						user_id: userId,
						lis_person_name_full: userName,
					},
				};

				const result: Authorization = await useCase.getLaunchParameters(userId, userRole, 'toolId', 'courseId');

				expect(result).toEqual(authorization);
				expect(oauth.authorize).toHaveBeenCalledWith(expectedRequestData);
			});

			it('should return authorization with email privacy_permission', async () => {
				const { userId, userRole, ltiTool, authorization, userDto } = setup();
				ltiTool.privacy_permission = LtiPrivacyPermission.EMAIL;
				const expectedRequestData: RequestOptions = {
					url: ltiTool.url,
					method: 'POST',
					data: {
						lti_version: ltiTool.lti_version,
						lti_message_type: ltiTool.lti_message_type,
						resource_link_id: ltiTool.resource_link_id,
						roles: LtiRole.LEARNER,
						launch_presentation_document_target: 'window',
						launch_presentation_locale: 'en',
						user_id: userId,
						lis_person_contact_email_primary: userDto.email,
					},
				};

				const result: Authorization = await useCase.getLaunchParameters(userId, userRole, 'toolId', 'courseId');

				expect(result).toEqual(authorization);
				expect(oauth.authorize).toHaveBeenCalledWith(expectedRequestData);
			});

			it('should return authorization with custom fields', async () => {
				const { userId, userRole, ltiTool, authorization } = setup();
				ltiTool.customs = [new CustomLtiProperty('field1', 'value1'), new CustomLtiProperty('field2', 'value2')];
				const expectedRequestData: RequestOptions = {
					url: ltiTool.url,
					method: 'POST',
					data: {
						lti_version: ltiTool.lti_version,
						lti_message_type: ltiTool.lti_message_type,
						resource_link_id: ltiTool.resource_link_id,
						roles: LtiRole.LEARNER,
						launch_presentation_document_target: 'window',
						launch_presentation_locale: 'en',
						user_id: userId,
						custom_field1: 'value1',
						custom_field2: 'value2',
					},
				};

				const result: Authorization = await useCase.getLaunchParameters(userId, userRole, 'toolId', 'courseId');

				expect(result).toEqual(authorization);
				expect(oauth.authorize).toHaveBeenCalledWith(expectedRequestData);
			});
		});

		describe('with invalid tool parameters', () => {
			const setup = () => {
				const userId = 'userId';
				const userRole: RoleName = RoleName.USER;

				const ltiTool: LtiToolDO = new LtiToolDO({
					name: 'name',
					url: 'url',
					key: 'key',
					secret: 'secret',
					roles: [],
					privacy_permission: LtiPrivacyPermission.PSEUDONYMOUS,
					customs: [],
					isTemplate: false,
					openNewTab: false,
					isHidden: false,
					lti_version: 'LTI-1p0',
					lti_message_type: 'messageType',
					resource_link_id: 'linkId',
				});

				return {
					userId,
					userRole,
					ltiTool,
				};
			};

			it('should throw when trying to access an lti tool that is not v1.1', async () => {
				const { userId, userRole, ltiTool } = setup();
				ltiTool.lti_version = 'LTI-wrong-version';

				ltiToolRepo.findById.mockResolvedValue(ltiTool);

				const func = () => useCase.getLaunchParameters(userId, userRole, 'toolId', 'courseId');
				await expect(func).rejects.toThrow();
			});

			it('should throw when trying to access an lti tool that has no message type', async () => {
				const { userId, userRole, ltiTool } = setup();
				ltiTool.lti_message_type = undefined;

				ltiToolRepo.findById.mockResolvedValue(ltiTool);

				const func = () => useCase.getLaunchParameters(userId, userRole, 'toolId', 'courseId');
				await expect(func).rejects.toThrow(InternalServerErrorException);
			});
		});
	});
});
