import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Test, TestingModule } from '@nestjs/testing';
import { Pseudonym, TeamEntity, UserDO } from '@shared/domain';
import { TeamsRepo } from '@shared/repo';
import { externalToolFactory, pseudonymFactory, setupEntities, userDoFactory } from '@shared/testing';
import { teamFactory } from '@shared/testing/factory/team.factory';
import { IdToken } from '@src/modules/oauth-provider/interface/id-token';
import { OauthScope } from '@src/modules/oauth-provider/interface/oauth-scope.enum';
import { IdTokenService } from '@src/modules/oauth-provider/service/id-token.service';
import { PseudonymService } from '@src/modules/pseudonym/service';
import { ExternalTool } from '@src/modules/tool/external-tool/domain';
import { UserService } from '@src/modules/user/service/user.service';
import { IdTokenCreationLoggableException } from '../error/id-token-creation-exception.loggable';
import { OauthProviderLoginFlowService } from './oauth-provider.login-flow.service';
import resetAllMocks = jest.resetAllMocks;

describe('IdTokenService', () => {
	let module: TestingModule;
	let service: IdTokenService;

	let oauthProviderLoginFlowService: DeepMocked<OauthProviderLoginFlowService>;
	let pseudonymService: DeepMocked<PseudonymService>;
	let teamsRepo: DeepMocked<TeamsRepo>;
	let userService: DeepMocked<UserService>;

	const hostUrl = 'https://host.de';

	beforeAll(async () => {
		jest.spyOn(Configuration, 'get').mockImplementation((key: string) => {
			switch (key) {
				case 'HOST':
					return hostUrl;
				default:
					return null;
			}
		});

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
					provide: TeamsRepo,
					useValue: createMock<TeamsRepo>(),
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
		teamsRepo = module.get(TeamsRepo);
		userService = module.get(UserService);

		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		resetAllMocks();
	});

	describe('createIdToken', () => {
		describe('when scopes are empty', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.buildWithId({ schoolId: 'schoolId' });

				const displayName = 'display name';

				const tool: ExternalTool = externalToolFactory.withOauth2Config().buildWithId();

				const pseudonym: Pseudonym = pseudonymFactory.build({ pseudonym: 'pseudonym' });

				userService.findById.mockResolvedValue(user);
				userService.getDisplayName.mockResolvedValue(displayName);
				oauthProviderLoginFlowService.findToolByClientId.mockResolvedValue(tool);
				pseudonymService.findByUserAndTool.mockResolvedValue(pseudonym);

				return {
					user,
					displayName,
					tool,
					pseudonym,
				};
			};

			it('should return the correct id token', async () => {
				const { user } = setup();

				const result: IdToken = await service.createIdToken('userId', [], 'clientId');

				expect(result).toEqual<IdToken>({
					iframe:
						'<iframe src="https://host.de/oauth2/username/pseudonym" title="username" style="height: 26px; width: 180px; border: none;"></iframe>',
					schoolId: user.schoolId,
				});
			});
		});

		describe('when scopes contain groups', () => {
			const setup = () => {
				const team: TeamEntity = teamFactory.buildWithId();

				const user: UserDO = userDoFactory.buildWithId({ schoolId: 'schoolId' });

				const displayName = 'display name';

				const tool: ExternalTool = externalToolFactory.withOauth2Config().buildWithId();

				const pseudonym: Pseudonym = pseudonymFactory.build({ pseudonym: 'pseudonym' });

				teamsRepo.findByUserId.mockResolvedValue([team]);
				userService.findById.mockResolvedValue(user);
				userService.getDisplayName.mockResolvedValue(displayName);
				oauthProviderLoginFlowService.findToolByClientId.mockResolvedValue(tool);
				pseudonymService.findByUserAndTool.mockResolvedValue(pseudonym);

				return {
					team,
					user,
					displayName,
					tool,
					pseudonym,
				};
			};

			it('should return the correct id token', async () => {
				const { user, team } = setup();

				const result: IdToken = await service.createIdToken('userId', [OauthScope.GROUPS], 'clientId');

				expect(result).toEqual<IdToken>({
					iframe:
						'<iframe src="https://host.de/oauth2/username/pseudonym" title="username" style="height: 26px; width: 180px; border: none;"></iframe>',
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
				const user: UserDO = userDoFactory.buildWithId({ schoolId: 'schoolId' });

				const displayName = 'display name';

				const tool: ExternalTool = externalToolFactory.withOauth2Config().buildWithId();

				const pseudonym: Pseudonym = pseudonymFactory.build({ pseudonym: 'pseudonym' });

				userService.findById.mockResolvedValue(user);
				userService.getDisplayName.mockResolvedValue(displayName);
				oauthProviderLoginFlowService.findToolByClientId.mockResolvedValue(tool);
				pseudonymService.findByUserAndTool.mockResolvedValue(pseudonym);

				return {
					user,
					displayName,
					tool,
					pseudonym,
				};
			};

			it('should return the correct id token', async () => {
				const { user } = setup();

				const result: IdToken = await service.createIdToken('userId', [OauthScope.EMAIL], 'clientId');

				expect(result).toEqual<IdToken>({
					iframe:
						'<iframe src="https://host.de/oauth2/username/pseudonym" title="username" style="height: 26px; width: 180px; border: none;"></iframe>',
					schoolId: user.schoolId,
					email: user.email,
				});
			});
		});

		describe('when scopes contain profile', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.buildWithId({ schoolId: 'schoolId' });

				const displayName = 'display name';

				const tool: ExternalTool = externalToolFactory.withOauth2Config().buildWithId();

				const pseudonym: Pseudonym = pseudonymFactory.build({ pseudonym: 'pseudonym' });

				userService.findById.mockResolvedValue(user);
				userService.getDisplayName.mockResolvedValue(displayName);
				oauthProviderLoginFlowService.findToolByClientId.mockResolvedValue(tool);
				pseudonymService.findByUserAndTool.mockResolvedValue(pseudonym);

				return {
					user,
					displayName,
					tool,
					pseudonym,
				};
			};

			it('should return the correct id token', async () => {
				const { user, displayName } = setup();

				const result: IdToken = await service.createIdToken('userId', [OauthScope.PROFILE], 'clientId');

				expect(result).toEqual<IdToken>({
					iframe:
						'<iframe src="https://host.de/oauth2/username/pseudonym" title="username" style="height: 26px; width: 180px; border: none;"></iframe>',
					schoolId: user.schoolId,
					name: displayName,
					userId: user.id,
				});
			});
		});

		describe('when the tool has no id', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.buildWithId({ schoolId: 'schoolId' });

				const displayName = 'display name';

				const tool: ExternalTool = externalToolFactory.withOauth2Config().build({ id: undefined });

				const pseudonym: Pseudonym = pseudonymFactory.build({ pseudonym: 'pseudonym' });

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
