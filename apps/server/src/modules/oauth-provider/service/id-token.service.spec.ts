import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { IdTokenService } from '@src/modules/oauth-provider/service/id-token.service';
import { LtiToolRepo, PseudonymsRepo, TeamsRepo } from '@shared/repo';
import { UserService } from '@src/modules/user/service/user.service';
import { UserDto } from '@src/modules/user/uc/dto/user.dto';
import { OauthScope } from '@src/modules/oauth-provider/interface/oauth-scope.enum';
import { PseudonymDO, Team } from '@shared/domain';
import { GroupNameIdTuple, IdToken } from '@src/modules/oauth-provider/interface/id-token';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Logger } from '@src/core/logger';
import { teamFactory } from '@shared/testing/factory/team.factory';
import { MikroORM } from '@mikro-orm/core';
import { setupEntities } from '@shared/testing';
import resetAllMocks = jest.resetAllMocks;
import clearAllMocks = jest.clearAllMocks;

class IdTokenServiceSpec extends IdTokenService {
	buildGroupsClaimSpec(teams: Team[]): GroupNameIdTuple[] {
		return super.buildGroupsClaim(teams);
	}

	async createIframeSubjectSpec(userId: string, clientId: string): Promise<string | undefined> {
		return super.createIframeSubject(userId, clientId);
	}

	getIframePropertiesSpec(): string {
		return this.iFrameProperties;
	}
}

describe('IdTokenService', () => {
	let orm: MikroORM;
	let module: TestingModule;
	let idTokenService: IdTokenServiceSpec;
	let pseudonymRepo: DeepMocked<PseudonymsRepo>;
	let ltiToolRepo: DeepMocked<LtiToolRepo>;
	let teamsRepo: DeepMocked<TeamsRepo>;
	let userService: DeepMocked<UserService>;

	const userId = 'userId';
	const clientId = 'clientId';
	const host = 'http://host';
	let ltiToolDo: LtiToolDO;
	let pseudonymDo: PseudonymDO;

	beforeAll(async () => {
		jest.spyOn(Configuration, 'get').mockImplementation((key: string) => {
			switch (key) {
				case 'HOST':
					return host;
				default:
					return null;
			}
		});

		module = await Test.createTestingModule({
			providers: [
				IdTokenServiceSpec,
				{
					provide: PseudonymsRepo,
					useValue: createMock<PseudonymsRepo>(),
				},
				{
					provide: LtiToolRepo,
					useValue: createMock<LtiToolRepo>(),
				},
				{
					provide: TeamsRepo,
					useValue: createMock<TeamsRepo>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		idTokenService = module.get(IdTokenServiceSpec);
		pseudonymRepo = module.get(PseudonymsRepo);
		ltiToolRepo = module.get(LtiToolRepo);
		teamsRepo = module.get(TeamsRepo);
		userService = module.get(UserService);
		orm = await setupEntities();
	});

	afterAll(async () => {
		await module.close();
		await orm.close();
		clearAllMocks();
	});

	beforeEach(() => {
		ltiToolDo = { id: 'ltiToolId' } as LtiToolDO;
		pseudonymDo = { pseudonym: 'Pseudonym' } as PseudonymDO;
	});

	afterEach(() => {
		resetAllMocks();
	});

	describe('createIdToken', () => {
		let userDto: UserDto;
		let scopes: string[];

		beforeEach(() => {
			userDto = { id: userId, email: 'email', schoolId: 'schoolId' } as UserDto;
			scopes = ['openid', 'offline', 'profile', 'email', 'groups'];
			userService.getUser.mockResolvedValue(userDto);
		});

		it('should call teamsRepo if scopes contains groups', async () => {
			// Act
			await idTokenService.createIdToken(userId, scopes, clientId);

			// Assert
			expect(teamsRepo.findByUserId).toHaveBeenCalledWith(userId);
		});

		it('should not call teamsRepo if scopes does not contain groups', async () => {
			// Arrange
			scopes = scopes.filter((scope: string) => scope !== OauthScope.GROUPS);

			// Act
			await idTokenService.createIdToken(userId, scopes, clientId);

			// Assert
			expect(teamsRepo.findByUserId).not.toHaveBeenCalled();
		});

		describe('tests id token and scopes', () => {
			let teams: Team[];
			let expectedName: string;

			beforeEach(() => {
				teams = [teamFactory.buildWithId()];
				expectedName = 'Max Mustermann';
				teamsRepo.findByUserId.mockResolvedValue(teams);
				ltiToolRepo.findByClientIdAndIsLocal.mockResolvedValue(ltiToolDo);
				pseudonymRepo.findByUserIdAndToolId.mockResolvedValue(pseudonymDo);
				userService.getUser.mockResolvedValue(userDto);
				userService.getDisplayName.mockResolvedValue(expectedName);
			});

			it('should return a full id token', async () => {
				// Act
				const result: IdToken = await idTokenService.createIdToken(userId, scopes, clientId);

				// Assert
				expect(result.iframe).toBeDefined();
				expect(result.email).toEqual(userDto.email);
				expect(result.name).toEqual(expectedName);
				expect(result.userId).toEqual(userDto.id);
				expect(result.schoolId).toEqual(userDto.schoolId);
				expect(result.groups).toEqual(
					expect.objectContaining<GroupNameIdTuple[]>([
						{
							gid: teams[0].id,
							displayName: teams[0].name,
						},
					])
				);

				expect(userService.getDisplayName).toHaveBeenCalledWith(userDto);
			});

			it('iframe should be undefined if iframe cant be build', async () => {
				// Arrange
				ltiToolRepo.findByClientIdAndIsLocal.mockResolvedValue(Promise.reject());

				// Act
				const result: IdToken = await idTokenService.createIdToken(userId, scopes, clientId);

				// Assert
				expect(result.iframe).toBeUndefined();
			});

			it('email should be undefined if scope is missing', async () => {
				// Arrange
				scopes = scopes.filter((scope: string) => scope !== OauthScope.EMAIL);

				// Act
				const result: IdToken = await idTokenService.createIdToken(userId, scopes, clientId);

				// Assert
				expect(result.email).toBeUndefined();
			});

			it('name should be undefined if scope is missing', async () => {
				// Arrange
				scopes = scopes.filter((scope: string) => scope !== OauthScope.PROFILE);

				// Act
				const result: IdToken = await idTokenService.createIdToken(userId, scopes, clientId);

				// Assert
				expect(result.name).toBeUndefined();
			});

			it('userId should be undefined if scope is missing', async () => {
				// Arrange
				scopes = scopes.filter((scope: string) => scope !== OauthScope.PROFILE);

				// Act
				const result: IdToken = await idTokenService.createIdToken(userId, scopes, clientId);

				// Assert
				expect(result.userId).toBeUndefined();
			});

			it('groups should be undefined if scope is missing', async () => {
				// Arrange
				scopes = scopes.filter((scope: string) => scope !== OauthScope.GROUPS);

				// Act
				const result: IdToken = await idTokenService.createIdToken(userId, scopes, clientId);

				// Assert
				expect(result.groups).toBeUndefined();
			});
		});
	});

	describe('createIframeSubject', () => {
		it('should create and return iframe string', async () => {
			// Arrange
			ltiToolRepo.findByClientIdAndIsLocal.mockResolvedValue(ltiToolDo);
			pseudonymRepo.findByUserIdAndToolId.mockResolvedValue(pseudonymDo);

			// Act
			const result = await idTokenService.createIframeSubjectSpec(userId, clientId);

			// Assert
			const expectedResult = `<iframe src="${host}/oauth2/username/${
				pseudonymDo.pseudonym
			}" ${idTokenService.getIframePropertiesSpec()}></iframe>`;
			expect(result).toEqual(expectedResult);

			expect(ltiToolRepo.findByClientIdAndIsLocal).toHaveBeenCalledWith(clientId, true);
			expect(pseudonymRepo.findByUserIdAndToolId).toHaveBeenCalledWith(userId, ltiToolDo.id);
		});

		it('should return undefined if ltiTool can not be found', async () => {
			// Arrange
			ltiToolRepo.findByClientIdAndIsLocal.mockResolvedValue(Promise.reject());

			// Act
			const result = await idTokenService.createIframeSubjectSpec(userId, clientId);

			// Assert
			expect(result).toBeUndefined();

			expect(ltiToolRepo.findByClientIdAndIsLocal).toHaveBeenCalledWith(clientId, true);
			expect(pseudonymRepo.findByUserIdAndToolId).not.toHaveBeenCalled();
		});

		it('should return undefined if pseudonym can not be found', async () => {
			// Arrange
			ltiToolRepo.findByClientIdAndIsLocal.mockResolvedValue(ltiToolDo);
			pseudonymRepo.findByUserIdAndToolId.mockResolvedValue(Promise.reject());

			// Act
			const result = await idTokenService.createIframeSubjectSpec(userId, clientId);

			// Assert
			expect(result).toBeUndefined();

			expect(ltiToolRepo.findByClientIdAndIsLocal).toHaveBeenCalledWith(clientId, true);
			expect(pseudonymRepo.findByUserIdAndToolId).toHaveBeenCalledWith(userId, ltiToolDo.id);
		});
	});

	describe('buildGroupsClaim', () => {
		it('should create and return a groups', () => {
			// Arrange
			const team1: Team = teamFactory.buildWithId();
			const team2: Team = teamFactory.buildWithId();
			const teams: Team[] = [team1, team2];

			// Act
			const result: GroupNameIdTuple[] = idTokenService.buildGroupsClaimSpec(teams);

			// Assert
			expect(result).toEqual<GroupNameIdTuple[]>([
				{ gid: team1.id, displayName: team1.name },
				{ gid: team2.id, displayName: team2.name },
			]);
		});

		it('should return an empty array', () => {
			// Act
			const result = idTokenService.buildGroupsClaimSpec([]);

			// Assert
			expect(result.length === 0).toBeTruthy();
		});
	});
});
