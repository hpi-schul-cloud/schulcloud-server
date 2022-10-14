import { Test, TestingModule } from '@nestjs/testing';
import { ICurrentUser, LtiPrivacyPermission, RoleName } from '@shared/domain';
import { Lti11Service } from '@src/modules/tool/service/lti11.service';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { LtiRoleMapper } from '@src/modules/tool/mapper/lti-role.mapper';
import { LtiToolRepo } from '@shared/repo';
import { UserService } from '@src/modules/user/service/user.service';
import { LtiRole } from '@src/modules/tool/interface/lti-role.enum';
import { UserDto } from '@src/modules/user/uc/dto/user.dto';
import { CustomLtiProperty, LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import OAuth, { Authorization, RequestOptions } from 'oauth-1.0a';
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
				const currentUser: ICurrentUser = { userId: 'userId', roles: [RoleName.USER] } as ICurrentUser;
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
				lti11Service.getUserIdOrPseudonym.mockResolvedValue(currentUser.userId);
				userService.getDisplayName.mockResolvedValue(userName);
				lti11Service.createConsumer.mockReturnValue(oauth);
				oauth.authorize.mockReturnValue(authorization);

				return {
					userName,
					currentUser,
					userDto,
					ltiTool,
					authorization,
				};
			};

			it('should use tool with resource_link_id', async () => {
				const { currentUser, ltiTool, authorization } = setup();
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
						user_id: currentUser.userId,
					},
				};

				const result: Authorization = await useCase.getLaunchParameters(currentUser, 'toolId', 'courseId');

				expect(result).toEqual(authorization);
				expect(oauth.authorize).toHaveBeenCalledWith(expect.objectContaining(expectedRequestData));
			});

			it('should use courseId as resource_link_id, if tool has none', async () => {
				const { currentUser, ltiTool, authorization } = setup();
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
						user_id: currentUser.userId,
					},
				};

				const result: Authorization = await useCase.getLaunchParameters(currentUser, 'toolId', courseId);

				expect(result).toEqual(authorization);
				expect(oauth.authorize).toHaveBeenCalledWith(expectedRequestData);
			});

			it('should use tool with pseudonymous privacy_permission', async () => {
				const { currentUser, ltiTool, authorization } = setup();
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
						user_id: currentUser.userId,
					},
				};

				const result: Authorization = await useCase.getLaunchParameters(currentUser, 'toolId', 'courseId');

				expect(result).toEqual(authorization);
				expect(oauth.authorize).toHaveBeenCalledWith(expectedRequestData);
			});

			it('should use tool with name privacy_permission', async () => {
				const { currentUser, ltiTool, authorization, userName } = setup();
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
						user_id: currentUser.userId,
						lis_person_name_full: userName,
					},
				};

				const result: Authorization = await useCase.getLaunchParameters(currentUser, 'toolId', 'courseId');

				expect(result).toEqual(authorization);
				expect(oauth.authorize).toHaveBeenCalledWith(expectedRequestData);
			});

			it('should use tool with email privacy_permission', async () => {
				const { currentUser, ltiTool, authorization, userDto } = setup();
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
						user_id: currentUser.userId,
						lis_person_contact_email_primary: userDto.email,
					},
				};

				const result: Authorization = await useCase.getLaunchParameters(currentUser, 'toolId', 'courseId');

				expect(result).toEqual(authorization);
				expect(oauth.authorize).toHaveBeenCalledWith(expectedRequestData);
			});

			it('should use tool with custom fields', async () => {
				const { currentUser, ltiTool, authorization } = setup();
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
						user_id: currentUser.userId,
						custom_field1: 'value1',
						custom_field2: 'value2',
					},
				};

				const result: Authorization = await useCase.getLaunchParameters(currentUser, 'toolId', 'courseId');

				expect(result).toEqual(authorization);
				expect(oauth.authorize).toHaveBeenCalledWith(expectedRequestData);
			});
		});

		it('should throw when trying to access a lti tool that is not v1.1', async () => {
			const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;
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
			});

			ltiToolRepo.findById.mockResolvedValue(ltiTool);

			const func = () => useCase.getLaunchParameters(currentUser, 'toolId', 'courseId');

			await expect(func).rejects.toThrow();
		});
	});
});
