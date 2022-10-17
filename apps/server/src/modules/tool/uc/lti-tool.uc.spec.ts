import { Test, TestingModule } from '@nestjs/testing';
import { ICurrentUser, LtiPrivacyPermission, RoleName } from '@shared/domain';
import { Lti11Service } from '@src/modules/tool/service/lti11.service';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { LtiRoleMapper } from '@src/modules/tool/mapper/lti-role.mapper';
import { LtiToolRepo } from '@shared/repo';
import { UserService } from '@src/modules/user/service/user.service';
import { LtiRole } from '@src/modules/tool/interface/lti-role.enum';
import { UserDto } from '@src/modules/user/uc/dto/user.dto';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import OAuth, { Authorization, RequestOptions } from 'oauth-1.0a';
import { Lti11Uc } from './lti11.uc';
import { CustomLtiProperty } from '@src/modules/tool/controller/dto/custom-lti-property.body';
import { LtiToolUc } from '@src/modules/tool/uc/lti-tool.uc';
import { AuthorizationService } from '@src/modules';

describe('LtiToolUc', () => {
	let module: TestingModule;
	let uc: LtiToolUc;

	let ltiToolRepo: DeepMocked<LtiToolRepo>;
	let authorizationService: DeepMocked<AuthorizationService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				LtiToolUc,
				{
					provide: LtiToolRepo,
					useValue: createMock<LtiToolRepo>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
			],
		}).compile();

		uc = module.get(LtiToolUc);
		ltiToolRepo = module.get(LtiToolRepo);
		authorizationService = module.get(AuthorizationService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findLtiTool', () => {});
	describe('getLtiTool', () => {});
	describe('createLtiTool', () => {});
	describe('updateLtiTool', () => {});
	describe('deleteLtiTool', () => {});
});
