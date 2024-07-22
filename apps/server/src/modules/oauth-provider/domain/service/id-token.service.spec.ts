import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { IdToken } from '@modules/oauth-provider/interface/id-token';
import { OauthScope } from '@modules/oauth-provider/interface/oauth-scope.enum';
import { IdTokenService } from '@modules/oauth-provider/service/id-token.service';
import { PseudonymService } from '@modules/pseudonym/service';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { externalToolFactory } from '@modules/tool/external-tool/testing';
import { UserService } from '@modules/user/service/user.service';
import { Test, TestingModule } from '@nestjs/testing';
import { Pseudonym, UserDO } from '@shared/domain/domainobject';
import { TeamEntity } from '@shared/domain/entity';
import { TeamsRepo } from '@shared/repo';
import { pseudonymFactory, setupEntities, userDoFactory } from '@shared/testing';
import { teamFactory } from '@shared/testing/factory/team.factory';
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

				const result: IdToken = await service.createIdToken('userId', [], 'clientId');

				expect(result).toEqual<IdToken>({
					iframe: iframeSubject,
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

				const result: IdToken = await service.createIdToken('userId', [OauthScope.GROUPS], 'clientId');

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
				const user: UserDO = userDoFactory.buildWithId({ schoolId: 'schoolId' });

				const displayName = 'display name';

				const tool: ExternalTool = externalToolFactory.withOauth2Config().buildWithId();

				const pseudonym: Pseudonym = pseudonymFactory.build({ pseudonym: 'pseudonym' });

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

				const result: IdToken = await service.createIdToken('userId', [OauthScope.EMAIL], 'clientId');

				expect(result).toEqual<IdToken>({
					iframe: iframeSubject,
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

				const result: IdToken = await service.createIdToken('userId', [OauthScope.PROFILE], 'clientId');

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
