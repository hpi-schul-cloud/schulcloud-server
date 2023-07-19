import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { LtiPrivacyPermission, LtiRoleType, Pseudonym, RoleName, User } from '@shared/domain';
import { TeamRolePermissionsDto } from '@shared/infra/collaborative-storage/dto/team-role-permissions.dto';
import { NextcloudClient } from '@shared/infra/collaborative-storage/strategy/nextcloud/nextcloud.client';
import { NextcloudStrategy } from '@shared/infra/collaborative-storage/strategy/nextcloud/nextcloud.strategy';
import { LtiToolRepo } from '@shared/repo';
import { pseudonymFactory, setupEntities, userFactory } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { TeamDto, TeamUserDto } from '@src/modules/collaborative-storage/services/dto/team.dto';
import { ExternalToolService } from '@src/modules/tool';
import { PseudonymService } from '@src/modules/pseudonym';
import { UserService } from '@src/modules/user';

class NextcloudStrategySpec extends NextcloudStrategy {
	static specGenerateGroupId(dto: TeamRolePermissionsDto): string {
		return super.generateGroupId(dto);
	}

	static specGenerateGroupFolderName(teamId: string, teamName: string): string {
		return super.generateGroupFolderName(teamId, teamName);
	}

	specUpdateTeamUsersInGroup(groupId: string, teamUsers: TeamUserDto[]): Promise<void[][]> {
		return super.updateTeamUsersInGroup(groupId, teamUsers);
	}
}

describe('NextCloud Adapter Strategy', () => {
	let module: TestingModule;
	let strategy: NextcloudStrategySpec;

	let client: DeepMocked<NextcloudClient>;
	let pseudonymService: DeepMocked<PseudonymService>;
	let ltiToolRepo: DeepMocked<LtiToolRepo>;
	// TODO: beautfiy test and test userService
	let userService: DeepMocked<UserService>;

	let nextcloudTool: LtiToolDO;
	let logger: LegacyLogger;
	const toolName = 'SchulcloudNextcloud';

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				NextcloudStrategySpec,
				{
					provide: NextcloudClient,
					useValue: createMock<NextcloudClient>({ oidcInternalName: toolName }),
				},
				{
					provide: LtiToolRepo,
					useValue: createMock<LtiToolRepo>(),
				},
				{
					provide: PseudonymService,
					useValue: createMock<PseudonymService>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
			],
		}).compile();
		strategy = module.get(NextcloudStrategySpec);
		client = module.get(NextcloudClient);
		pseudonymService = module.get(PseudonymService);
		userService = module.get(UserService);
		ltiToolRepo = module.get(LtiToolRepo);
		logger = module.get(LegacyLogger);
		await setupEntities();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	beforeEach(() => {
		nextcloudTool = new LtiToolDO({
			id: 'toolId',
			name: toolName,
			isLocal: true,
			oAuthClientId: 'oauthClientId',
			secret: 'secret',
			customs: [{ key: 'key', value: 'value' }],
			isHidden: false,
			isTemplate: false,
			key: 'key',
			openNewTab: false,
			originToolId: 'originToolId',
			privacy_permission: LtiPrivacyPermission.NAME,
			roles: [LtiRoleType.INSTRUCTOR, LtiRoleType.LEARNER],
			url: 'url',
			friendlyUrl: 'friendlyUrl',
			frontchannel_logout_uri: 'frontchannel_logout_uri',
			logo_url: 'logo_url',
			lti_message_type: 'lti_message_type',
			lti_version: 'lti_version',
			resource_link_id: 'resource_link_id',
			skipConsent: true,
		});
		ltiToolRepo.findByName.mockResolvedValue([nextcloudTool]);
	});

	describe('updateTeamPermissionsForRole', () => {
		let teamRolePermissionsDto: TeamRolePermissionsDto;

		beforeEach(() => {
			teamRolePermissionsDto = {
				teamId: 'teamId',
				teamName: 'teamName',
				roleName: 'roleName',
				permissions: [],
			};
		});

		it('update team permissions if nextcloud group can be found', async () => {
			const groupId = 'groupId';
			const folderId = 1;

			client.findGroupId.mockResolvedValueOnce(groupId);
			client.findGroupFolderIdForGroupId.mockResolvedValueOnce(folderId);

			await strategy.updateTeamPermissionsForRole(teamRolePermissionsDto);

			expect(client.findGroupId).toHaveBeenCalledWith(
				NextcloudStrategySpec.specGenerateGroupId(teamRolePermissionsDto)
			);
			expect(client.findGroupFolderIdForGroupId).toHaveBeenCalledWith(groupId);
		});

		it('does not update team permissions if nextcloud group can not be found', async () => {
			const groupId = NextcloudStrategySpec.specGenerateGroupId(teamRolePermissionsDto);

			client.findGroupId.mockResolvedValueOnce(groupId);
			client.findGroupFolderIdForGroupId.mockRejectedValueOnce(new Error('some nextcloud error'));

			await strategy.updateTeamPermissionsForRole(teamRolePermissionsDto);

			expect(client.findGroupId).toHaveBeenCalledWith(groupId);
			expect(client.findGroupFolderIdForGroupId).toHaveBeenCalledWith(groupId);
		});
	});

	describe('deleteTeam', () => {
		it('delete team if nextcloud group exists', async () => {
			const groupId = 'groupId';
			const teamId = 'teamId';
			const folderId = 1;

			client.findGroupFolderIdForGroupId.mockResolvedValue(folderId);

			await strategy.deleteTeam(teamId);

			expect(client.findGroupFolderIdForGroupId).toHaveBeenCalledWith(groupId);
			expect(client.deleteGroup).toHaveBeenCalledWith(groupId);
			expect(client.deleteGroupFolder).toHaveBeenCalledWith(folderId);
		});
	});

	describe('createTeam', () => {
		it('should call client to create nextcloud group', async () => {
			const groupdId = 'groupdId';
			const teamDto: TeamDto = {
				teamUsers: [{ userId: 'userId', schoolId: 'schoolId', roleId: 'roleId' }],
				id: 'id',
				name: 'name',
			};
			const folderId = 1;

			client.getNameWithPrefix.mockReturnValue(groupdId);
			pseudonymService.findByUserAndTool.mockRejectedValueOnce(undefined);
			client.findGroupFolderIdForGroupId.mockResolvedValue(folderId);

			await strategy.createTeam(teamDto);

			expect(client.createGroup).toHaveBeenCalledWith(groupdId, teamDto.name);
			expect(client.findGroupFolderIdForGroupId).toHaveBeenCalledWith(groupdId);
			expect(client.changeGroupFolderName).toHaveBeenCalledWith(folderId, `${teamDto.name} (${teamDto.id})`);
		});
	});

	describe('updateTeam', () => {
		let teamDto: TeamDto;
		let nextCloudUserId: string;

		beforeEach(() => {
			teamDto = {
				teamUsers: [{ userId: 'userId', schoolId: 'schoolId', roleId: 'roleId' }],
				id: 'id',
				name: 'name',
			};
			nextCloudUserId = 'nextcloudUserId';
		});

		it('should throw error when teamId is missing', async () => {
			teamDto.id = '';

			// Act & Assert
			await expect(strategy.updateTeam(teamDto)).rejects.toThrow(UnprocessableEntityException);
		});

		it('should update team user and name if those exist', async () => {
			const folderId = 1;
			const groupId = 'groupId';
			client.getNameWithPrefix.mockReturnValue(groupId);
			client.getGroupUsers.mockResolvedValue([nextCloudUserId]);
			pseudonymService.findByUserAndTool.mockRejectedValueOnce(undefined);
			client.findGroupFolderIdForGroupId.mockResolvedValueOnce(folderId);

			await strategy.updateTeam(teamDto);

			expect(client.renameGroup).toHaveBeenCalledWith(groupId, teamDto.name);
			const expectedFolderName: string = NextcloudStrategySpec.specGenerateGroupFolderName(teamDto.id, teamDto.name);
			expect(client.changeGroupFolderName).toHaveBeenCalledWith(folderId, expectedFolderName);
		});

		it('should not update team user and name if those do not exist', async () => {
			const groupId = 'groupId';
			teamDto.teamUsers = [];
			teamDto.name = '';
			client.getNameWithPrefix.mockReturnValue(groupId);

			await strategy.updateTeam(teamDto);

			expect(client.getGroupUsers).not.toHaveBeenCalled();
			expect(client.findGroupFolderIdForGroupId).not.toHaveBeenCalled();
			expect(client.renameGroup).not.toHaveBeenCalled();
			expect(client.changeGroupFolderName).not.toHaveBeenCalled();
		});
	});

	describe('updateTeamUsersInGroup', () => {
		let user: User;
		let teamUsers: TeamUserDto[];
		let pseudonymDo: Pseudonym;
		let nextCloudUserId: string;
		let groupId: string;

		beforeEach(() => {
			user = userFactory.withRoleByName(RoleName.TEAMMEMBER).buildWithId();
			teamUsers = [{ userId: user.id, schoolId: user.school.id, roleId: user.roles[0].id }];

			pseudonymDo = pseudonymFactory.buildWithId({
				userId: user.id,
				toolId: nextcloudTool.id as string,
				pseudonym: `ps${user.id}`,
			});

			nextCloudUserId = `prefix-${pseudonymDo.pseudonym}`;
			groupId = 'groupId';
		});

		it('should add one user to group in nextcloud if added in sc team', async () => {
			client.getGroupUsers.mockResolvedValue([]);
			pseudonymService.findByUserAndTool.mockResolvedValue(pseudonymDo);
			client.getNameWithPrefix.mockReturnValue(nextCloudUserId);

			await strategy.specUpdateTeamUsersInGroup(groupId, teamUsers);

			expect(client.getGroupUsers).toHaveBeenCalledWith(groupId);
			expect(ltiToolRepo.findByName).toHaveBeenCalledWith(nextcloudTool.name);
			expect(pseudonymService.findByUserAndTool).toHaveBeenCalledWith(teamUsers[0].userId, pseudonymDo.toolId);
			expect(client.getNameWithPrefix).toHaveBeenCalledWith(pseudonymDo.pseudonym);
			expect(client.removeUserFromGroup).not.toHaveBeenCalled();
			expect(client.addUserToGroup).toHaveBeenCalledWith(nextCloudUserId, groupId);
		});

		it('should remove one user from group in nextcloud if not exist in sc team', async () => {
			client.getGroupUsers.mockResolvedValue([nextCloudUserId]);
			teamUsers = [];

			await strategy.specUpdateTeamUsersInGroup(groupId, teamUsers);

			expect(client.getGroupUsers).toHaveBeenCalledWith(groupId);
			expect(pseudonymService.findByUserAndTool).not.toHaveBeenCalled();
			expect(client.getNameWithPrefix).not.toHaveBeenCalled();
			expect(client.removeUserFromGroup).toHaveBeenCalledWith(nextCloudUserId, groupId);
			expect(client.addUserToGroup).not.toHaveBeenCalled();
		});

		it('should not add or remove if no pseudonym found', async () => {
			teamUsers = [
				{ userId: user.id, schoolId: user.school.id, roleId: user.roles[0].id },
				{ userId: 'invalidId', schoolId: 'someSchool', roleId: 'someRole' },
			];

			client.getGroupUsers.mockResolvedValue([nextCloudUserId]);
			pseudonymService.findByUserAndTool.mockResolvedValueOnce(pseudonymDo).mockRejectedValueOnce(undefined);
			client.getNameWithPrefix.mockReturnValue(nextCloudUserId);

			await strategy.specUpdateTeamUsersInGroup(groupId, teamUsers);

			expect(client.addUserToGroup).not.toHaveBeenCalled();
			expect(client.removeUserFromGroup).not.toHaveBeenCalled();
		});

		it('should log a warning when there are more than one team with the same name', async () => {
			const nextcloudTool2: LtiToolDO = { ...nextcloudTool };
			client.getGroupUsers.mockResolvedValue([nextCloudUserId]);
			ltiToolRepo.findByName.mockResolvedValue([nextcloudTool, nextcloudTool2]);
			pseudonymService.findByUserAndTool.mockResolvedValue(pseudonymDo);
			await strategy.specUpdateTeamUsersInGroup(groupId, teamUsers);

			expect(logger.warn).toHaveBeenCalled();
		});
	});

	describe('generateGroupFolderName', () => {
		const teamId = 'teamId';
		const teamName = 'teamName';

		const folderName: string = NextcloudStrategySpec.specGenerateGroupFolderName(teamId, teamName);

		expect(folderName).toEqual(`${teamName} (${teamId})`);
	});

	describe('generateGroupId', () => {
		it('should return concatenated groupId', () => {
			const dto: TeamRolePermissionsDto = {
				teamId: 'teamId',
				teamName: 'teamName',
				roleName: 'roleName',
				permissions: [],
			};

			const groupId: string = NextcloudStrategySpec.specGenerateGroupId(dto);

			expect(groupId).toEqual(`${dto.teamName}-${dto.teamId}-${dto.roleName}`);
		});
	});
});
