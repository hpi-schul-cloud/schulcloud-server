import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Test, TestingModule } from '@nestjs/testing';
import { PseudonymDO, Team, UserDO } from '@shared/domain';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { LtiToolRepo, PseudonymsRepo, TeamsRepo } from '@shared/repo';
import { setupEntities, userDoFactory } from '@shared/testing';
import { teamFactory } from '@shared/testing/factory/team.factory';
import { LegacyLogger } from '@src/core/logger';
import { GroupNameIdTuple, IdToken } from '@src/modules/oauth-provider/interface/id-token';
import { OauthScope } from '@src/modules/oauth-provider/interface/oauth-scope.enum';
import { IdTokenService } from '@src/modules/oauth-provider/service/id-token.service';
import { UserService } from '@src/modules/user/service/user.service';
import { ObjectId } from 'bson';
import clearAllMocks = jest.clearAllMocks;
import resetAllMocks = jest.resetAllMocks;

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
	let module: TestingModule;
	let idTokenService: IdTokenServiceSpec;
	let pseudonymRepo: DeepMocked<PseudonymsRepo>;
	let ltiToolRepo: DeepMocked<LtiToolRepo>;
	let teamsRepo: DeepMocked<TeamsRepo>;
	let userService: DeepMocked<UserService>;

	const userId = new ObjectId().toHexString();
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
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		idTokenService = module.get(IdTokenServiceSpec);
		pseudonymRepo = module.get(PseudonymsRepo);
		ltiToolRepo = module.get(LtiToolRepo);
		teamsRepo = module.get(TeamsRepo);
		userService = module.get(UserService);
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
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
		let user: UserDO;
		let scopes: string[];

		beforeEach(() => {
			user = userDoFactory.buildWithId({ email: 'email', schoolId: 'schoolId' }, userId);
			scopes = ['openid', 'offline', 'profile', 'email', 'groups'];
			userService.findById.mockResolvedValue(user);
		});

		it('should call teamsRepo if scopes contains groups', async () => {
			await idTokenService.createIdToken(userId, scopes, clientId);

			expect(teamsRepo.findByUserId).toHaveBeenCalledWith(userId);
		});

		it('should not call teamsRepo if scopes does not contain groups', async () => {
			scopes = scopes.filter((scope: string) => scope !== OauthScope.GROUPS);

			await idTokenService.createIdToken(userId, scopes, clientId);

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
				pseudonymRepo.findByUserIdAndToolIdOrFail.mockResolvedValue(pseudonymDo);
				userService.findById.mockResolvedValue(user);
				userService.getDisplayName.mockResolvedValue(expectedName);
			});

			it('should return a full id token', async () => {
				const result: IdToken = await idTokenService.createIdToken(userId, scopes, clientId);

				expect(result.iframe).toBeDefined();
				expect(result.email).toEqual(user.email);
				expect(result.name).toEqual(expectedName);
				expect(result.userId).toEqual(user.id);
				expect(result.schoolId).toEqual(user.schoolId);
				expect(result.groups).toEqual(
					expect.objectContaining<GroupNameIdTuple[]>([
						{
							gid: teams[0].id,
							displayName: teams[0].name,
						},
					])
				);

				expect(userService.getDisplayName).toHaveBeenCalledWith(user);
			});

			it('iframe should be undefined if iframe cant be build', async () => {
				ltiToolRepo.findByClientIdAndIsLocal.mockResolvedValue(Promise.reject());

				const result: IdToken = await idTokenService.createIdToken(userId, scopes, clientId);

				expect(result.iframe).toBeUndefined();
			});

			it('email should be undefined if scope is missing', async () => {
				scopes = scopes.filter((scope: string) => scope !== OauthScope.EMAIL);

				const result: IdToken = await idTokenService.createIdToken(userId, scopes, clientId);

				expect(result.email).toBeUndefined();
			});

			it('name should be undefined if scope is missing', async () => {
				scopes = scopes.filter((scope: string) => scope !== OauthScope.PROFILE);

				const result: IdToken = await idTokenService.createIdToken(userId, scopes, clientId);

				expect(result.name).toBeUndefined();
			});

			it('userId should be undefined if scope is missing', async () => {
				scopes = scopes.filter((scope: string) => scope !== OauthScope.PROFILE);

				const result: IdToken = await idTokenService.createIdToken(userId, scopes, clientId);

				expect(result.userId).toBeUndefined();
			});

			it('groups should be undefined if scope is missing', async () => {
				scopes = scopes.filter((scope: string) => scope !== OauthScope.GROUPS);

				const result: IdToken = await idTokenService.createIdToken(userId, scopes, clientId);

				expect(result.groups).toBeUndefined();
			});
		});
	});

	describe('createIframeSubject', () => {
		it('should create and return iframe string', async () => {
			ltiToolRepo.findByClientIdAndIsLocal.mockResolvedValue(ltiToolDo);
			pseudonymRepo.findByUserIdAndToolIdOrFail.mockResolvedValue(pseudonymDo);

			const result = await idTokenService.createIframeSubjectSpec(userId, clientId);

			const expectedResult = `<iframe src="${host}/oauth2/username/${
				pseudonymDo.pseudonym
			}" ${idTokenService.getIframePropertiesSpec()}></iframe>`;
			expect(result).toEqual(expectedResult);

			expect(ltiToolRepo.findByClientIdAndIsLocal).toHaveBeenCalledWith(clientId, true);
			expect(pseudonymRepo.findByUserIdAndToolIdOrFail).toHaveBeenCalledWith(userId, ltiToolDo.id);
		});

		it('should return undefined if ltiTool can not be found', async () => {
			ltiToolRepo.findByClientIdAndIsLocal.mockResolvedValue(Promise.reject());

			const result = await idTokenService.createIframeSubjectSpec(userId, clientId);

			expect(result).toBeUndefined();

			expect(ltiToolRepo.findByClientIdAndIsLocal).toHaveBeenCalledWith(clientId, true);
			expect(pseudonymRepo.findByUserIdAndToolIdOrFail).not.toHaveBeenCalled();
		});

		it('should return undefined if pseudonym can not be found', async () => {
			ltiToolRepo.findByClientIdAndIsLocal.mockResolvedValue(ltiToolDo);
			pseudonymRepo.findByUserIdAndToolIdOrFail.mockResolvedValue(Promise.reject());

			const result = await idTokenService.createIframeSubjectSpec(userId, clientId);

			expect(result).toBeUndefined();

			expect(ltiToolRepo.findByClientIdAndIsLocal).toHaveBeenCalledWith(clientId, true);
			expect(pseudonymRepo.findByUserIdAndToolIdOrFail).toHaveBeenCalledWith(userId, ltiToolDo.id);
		});
	});

	describe('buildGroupsClaim', () => {
		it('should create and return a groups', () => {
			const team1: Team = teamFactory.buildWithId();
			const team2: Team = teamFactory.buildWithId();
			const teams: Team[] = [team1, team2];

			const result: GroupNameIdTuple[] = idTokenService.buildGroupsClaimSpec(teams);

			expect(result).toEqual<GroupNameIdTuple[]>([
				{ gid: team1.id, displayName: team1.name },
				{ gid: team2.id, displayName: team2.name },
			]);
		});

		it('should return an empty array', () => {
			const result = idTokenService.buildGroupsClaimSpec([]);

			expect(result.length === 0).toBeTruthy();
		});
	});
});
