import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { LtiToolRepo } from '@shared/repo';
import { LtiToolUc } from '@src/modules/tool/uc/lti-tool.uc';
import { AuthorizationService } from '@src/modules';
import { userFactory } from '@shared/testing';
import { ICurrentUser, User } from '@shared/domain';

// TODO: test me
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

	function setup() {
		const user: User = userFactory.buildWithId();
		const currentUser: ICurrentUser = { userId: user.id } as ICurrentUser;
		return { user, currentUser };
	}

	describe('findLtiTool', () => {});

	describe('getLtiTool', () => {
		it('should call the authorizationService', () => {
			// authorizationService.
		});
	});

	describe('createLtiTool', () => {});
	describe('updateLtiTool', () => {});
	describe('deleteLtiTool', () => {});
});
