import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { PseudonymService } from '@modules/pseudonym/service';
import { pseudonymFactory } from '@modules/pseudonym/testing';
import { TeamRepo } from '@modules/team/repo';
import { teamFactory } from '@modules/team/testing';
import { externalToolFactory } from '@modules/tool/external-tool/testing';
import { UserService } from '@modules/user';
import { User } from '@modules/user/repo';
import { userDoFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { IdTokenCreationLoggableException } from '../error';
import { IdToken, OauthScope } from '../interface';
import { IdTokenService } from './id-token.service';
import { OauthProviderLoginFlowService } from './oauth-provider.login-flow.service';

describe('IdTokenService', () => {
	let module: TestingModule;
	let service: IdTokenService;

	let oauthProviderLoginFlowService: DeepMocked<OauthProviderLoginFlowService>;
	let pseudonymService: DeepMocked<PseudonymService>;
	let teamRepo: DeepMocked<TeamRepo>;
	let userService: DeepMocked<UserService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				IdTokenService,
				{
					provide: OauthProviderLoginFlowService,
					useValue: createMock<OauthProviderLoginFlowService>(),
				},
				{
					provide: PseudonymService,
					useValue: createMock<PseudonymService>(),
				},
				{
					provide: TeamRepo,
					useValue: createMock<TeamRepo>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
			],
		}).compile();

		service = module.get(IdTokenService);

		oauthProviderLoginFlowService = module.get(OauthProviderLoginFlowService);
		pseudonymService = module.get(PseudonymService);
		teamRepo = module.get(TeamRepo);
		userService = module.get(UserService);

		await setupEntities([User]);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('createIdToken', () => {
		describe('when scopes are empty', () => {
			const setup = () => {
				const user = userDoFactory.buildWithId({ schoolId: 'schoolId' });

				const displayName = 'display name';

				const tool = externalToolFactory.withOauth2Config().buildWithId();

				const pseudonym = pseudonymFactory.build({ pseudonym: 'pseudonym' });

				userService.findById.mockResolvedValue(user);
				userService.getDisplayName.mockResolvedValue(displayName);
				oauthProviderLoginFlowService.findToolByClientId.mockResolvedValue(tool);
				pseudonymService.findByUserAndToolOrThrow.mockResolvedValue(pseudonym);
				const iframeSubject = 'iframeSubject';
				pseudonymService.getIframeSubject.mockReturnValueOnce(iframeSubject);

				return {
					user,
					displayName,
					tool,
					pseudonym,
					iframeSubject,
				};
			};

			it('should return the correct id token', async () => {
				const { user, iframeSubject } = setup();

				const result = await service.createIdToken('userId', [], 'clientId');

				expect(result).toEqual<IdToken>({
					iframe: iframeSubject,
					schoolId: user.schoolId,
				});
			});
		});

		describe('when scopes contain groups', () => {
			const setup = () => {
				const team = teamFactory.buildWithId();
				const user = userDoFactory.buildWithId({ schoolId: 'schoolId' });
				const displayName = 'display name';
				const tool = externalToolFactory.withOauth2Config().buildWithId();
				const pseudonym = pseudonymFactory.build({ pseudonym: 'pseudonym' });

				teamRepo.findByUserId.mockResolvedValue([team]);
				userService.findById.mockResolvedValue(user);
				userService.getDisplayName.mockResolvedValue(displayName);
				oauthProviderLoginFlowService.findToolByClientId.mockResolvedValue(tool);
				pseudonymService.findByUserAndToolOrThrow.mockResolvedValue(pseudonym);
				const iframeSubject = 'iframeSubject';
				pseudonymService.getIframeSubject.mockReturnValueOnce(iframeSubject);

				return {
					team,
					user,
					displayName,
					tool,
					pseudonym,
					iframeSubject,
				};
			};

			it('should return the correct id token', async () => {
				const { user, team, iframeSubject } = setup();

				const result = await service.createIdToken('userId', [OauthScope.GROUPS], 'clientId');

				expect(result).toEqual<IdToken>({
					iframe: iframeSubject,
					schoolId: user.schoolId,
					groups: [
						{
							gid: team.id,
							displayName: team.name,
						},
					],
				});
			});
		});

		describe('when scopes contain email', () => {
			const setup = () => {
				const user = userDoFactory.buildWithId({ schoolId: 'schoolId' });
				const displayName = 'display name';
				const tool = externalToolFactory.withOauth2Config().buildWithId();
				const pseudonym = pseudonymFactory.build({ pseudonym: 'pseudonym' });

				userService.findById.mockResolvedValue(user);
				userService.getDisplayName.mockResolvedValue(displayName);
				oauthProviderLoginFlowService.findToolByClientId.mockResolvedValue(tool);
				pseudonymService.findByUserAndToolOrThrow.mockResolvedValue(pseudonym);
				const iframeSubject = 'iframeSubject';
				pseudonymService.getIframeSubject.mockReturnValueOnce(iframeSubject);

				return {
					user,
					displayName,
					tool,
					pseudonym,
					iframeSubject,
				};
			};

			it('should return the correct id token', async () => {
				const { user, iframeSubject } = setup();

				const result = await service.createIdToken('userId', [OauthScope.EMAIL], 'clientId');

				expect(result).toEqual<IdToken>({
					iframe: iframeSubject,
					schoolId: user.schoolId,
					email: user.email,
				});
			});
		});

		describe('when scopes contain profile', () => {
			const setup = () => {
				const user = userDoFactory.buildWithId({ schoolId: 'schoolId' });
				const displayName = 'display name';
				const tool = externalToolFactory.withOauth2Config().buildWithId();
				const pseudonym = pseudonymFactory.build({ pseudonym: 'pseudonym' });

				userService.findById.mockResolvedValue(user);
				userService.getDisplayName.mockResolvedValue(displayName);
				oauthProviderLoginFlowService.findToolByClientId.mockResolvedValue(tool);
				pseudonymService.findByUserAndToolOrThrow.mockResolvedValue(pseudonym);
				const iframeSubject = 'iframeSubject';
				pseudonymService.getIframeSubject.mockReturnValueOnce(iframeSubject);

				return {
					user,
					displayName,
					tool,
					pseudonym,
					iframeSubject,
				};
			};

			it('should return the correct id token', async () => {
				const { user, displayName, iframeSubject } = setup();

				const result = await service.createIdToken('userId', [OauthScope.PROFILE], 'clientId');

				expect(result).toEqual<IdToken>({
					iframe: iframeSubject,
					schoolId: user.schoolId,
					name: displayName,
					userId: user.id,
				});
			});
		});

		describe('when the tool has no id', () => {
			const setup = () => {
				const user = userDoFactory.buildWithId({ schoolId: 'schoolId' });
				const displayName = 'display name';
				const tool = externalToolFactory.withOauth2Config().build({ id: undefined });
				const pseudonym = pseudonymFactory.build({ pseudonym: 'pseudonym' });

				userService.findById.mockResolvedValue(user);
				userService.getDisplayName.mockResolvedValue(displayName);
				oauthProviderLoginFlowService.findToolByClientId.mockResolvedValue(tool);

				return {
					user,
					displayName,
					tool,
					pseudonym,
				};
			};

			it('should throw an IdTokenCreationLoggableException', async () => {
				const { user } = setup();

				const func = async () => service.createIdToken('userId', [OauthScope.PROFILE], 'clientId');

				await expect(func).rejects.toThrow(new IdTokenCreationLoggableException('clientId', user.id));
			});
		});
	});
});
