import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Logger } from '@src/core/logger';
import { PseudonymsRepo } from '@shared/repo/index';
import { NextcloudStrategy } from '@shared/infra/collaborative-storage/strategy/nextcloud/nextcloud.strategy';
import { TeamRolePermissionsDto } from '@shared/infra/collaborative-storage/dto/team-role-permissions.dto';
import { TeamDto, TeamUserDto } from '@src/modules/collaborative-storage/services/dto/team.dto';
import { NextcloudClient } from '@shared/infra/collaborative-storage/strategy/nextcloud/nextcloud.client';
import { setupEntities, userFactory } from '@shared/testing/index';
import { PseudonymDO, RoleName, User } from '@shared/domain/index';
import { MikroORM } from '@mikro-orm/core';
import { UnprocessableEntityException } from '@nestjs/common';
import { LtiToolRepo } from '@shared/repo/ltitool/index';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';

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
	let orm: MikroORM;
	let strategy: NextcloudStrategySpec;

	let client: DeepMocked<NextcloudClient>;
	let pseudonymsRepo: DeepMocked<PseudonymsRepo>;
	let ltiToolRepo: DeepMocked<LtiToolRepo>;
	let nextcloudTool: LtiToolDO;
	const toolName = 'SchulcloudNextcloud';

	afterAll(async () => {
		await orm.close();
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
					provide: PseudonymsRepo,
					useValue: createMock<PseudonymsRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();
		strategy = module.get(NextcloudStrategySpec);
		client = module.get(NextcloudClient);
		pseudonymsRepo = module.get(PseudonymsRepo);
		ltiToolRepo = module.get(LtiToolRepo);
		orm = await setupEntities();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	beforeEach(() => {
		nextcloudTool = new LtiToolDO({
			id: 'toolId',
			name: toolName,
			createdAt: new Date('2022-07-20'),
			updatedAt: new Date('2022-07-20'),
		});
		ltiToolRepo.findByName.mockResolvedValue(nextcloudTool);
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
			// Arrange
			const groupId = 'groupId';
			const folderId = 1;

			client.findGroupId.mockResolvedValueOnce(groupId);
			client.findGroupFolderIdForGroupId.mockResolvedValueOnce(folderId);

			// Act
			await strategy.updateTeamPermissionsForRole(teamRolePermissionsDto);

			// Assert
			expect(client.findGroupId).toHaveBeenCalledWith(
				NextcloudStrategySpec.specGenerateGroupId(teamRolePermissionsDto)
			);
			expect(client.findGroupFolderIdForGroupId).toHaveBeenCalledWith(groupId);
		});

		it('does not update team permissions if nextcloud group can not be found', async () => {
			// Arrange
			const groupId = NextcloudStrategySpec.specGenerateGroupId(teamRolePermissionsDto);

			client.findGroupId.mockResolvedValueOnce(groupId);
			client.findGroupFolderIdForGroupId.mockRejectedValueOnce(new Error('some nextcloud error'));

			// Act
			await strategy.updateTeamPermissionsForRole(teamRolePermissionsDto);

			// Assert
			expect(client.findGroupId).toHaveBeenCalledWith(groupId);
			expect(client.findGroupFolderIdForGroupId).toHaveBeenCalledWith(groupId);
		});
	});

	describe('deleteTeam', () => {
		it('delete team if nextcloud group exists', async () => {
			// Arrange
			const groupId = 'groupId';
			const teamId = 'teamId';
			const folderId = 1;

			client.findGroupFolderIdForGroupId.mockResolvedValue(folderId);

			// Act
			await strategy.deleteTeam(teamId);

			// Assert
			expect(client.findGroupFolderIdForGroupId).toHaveBeenCalledWith(groupId);
			expect(client.deleteGroup).toHaveBeenCalledWith(groupId);
			expect(client.deleteGroupFolder).toHaveBeenCalledWith(folderId);
		});
	});

	describe('createTeam', () => {
		it('should call client to create nextcloud group', async () => {
			// Arrange
			const groupdId = 'groupdId';
			const teamDto: TeamDto = {
				teamUsers: [{ userId: 'userId', schoolId: 'schoolId', roleId: 'roleId' }],
				id: 'id',
				name: 'name',
			};
			const folderId = 1;

			client.getNameWithPrefix.mockReturnValue(groupdId);
			pseudonymsRepo.findByUserIdAndToolId.mockRejectedValueOnce(undefined);
			client.findGroupFolderIdForGroupId.mockResolvedValue(folderId);

			// Act
			await strategy.createTeam(teamDto);

			// Assert
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
			// Arrange
			teamDto.id = '';

			// Act & Assert
			await expect(strategy.updateTeam(teamDto)).rejects.toThrow(UnprocessableEntityException);
		});

		it('should update team user and name if those exist', async () => {
			// Arrange
			const folderId = 1;
			const groupId = 'groupId';
			client.getNameWithPrefix.mockReturnValue(groupId);
			client.getGroupUsers.mockResolvedValue([nextCloudUserId]);
			pseudonymsRepo.findByUserIdAndToolId.mockRejectedValueOnce(undefined);
			client.findGroupFolderIdForGroupId.mockResolvedValueOnce(folderId);

			// Act
			await strategy.updateTeam(teamDto);

			// Assert
			expect(client.renameGroup).toHaveBeenCalledWith(groupId, teamDto.name);
			const expectedFolderName: string = NextcloudStrategySpec.specGenerateGroupFolderName(teamDto.id, teamDto.name);
			expect(client.changeGroupFolderName).toHaveBeenCalledWith(folderId, expectedFolderName);
		});

		it('should not update team user and name if those do not exist', async () => {
			// Arrange
			const groupId = 'groupId';
			teamDto.teamUsers = [];
			teamDto.name = '';
			client.getNameWithPrefix.mockReturnValue(groupId);

			// Act
			await strategy.updateTeam(teamDto);

			// Assert
			expect(client.getGroupUsers).not.toHaveBeenCalled();
			expect(client.findGroupFolderIdForGroupId).not.toHaveBeenCalled();
			expect(client.renameGroup).not.toHaveBeenCalled();
			expect(client.changeGroupFolderName).not.toHaveBeenCalled();
		});
	});

	describe('updateTeamUsersInGroup', () => {
		let user: User;
		let teamUsers: TeamUserDto[];
		let pseudonymDo: PseudonymDO;
		let nextCloudUserId: string;
		let groupId: string;

		beforeEach(() => {
			user = userFactory.withRole(RoleName.TEAMMEMBER).buildWithId();
			teamUsers = [{ userId: user.id, schoolId: user.school.id, roleId: user.roles[0].id }];

			pseudonymDo = new PseudonymDO({
				userId: user.id,
				toolId: nextcloudTool.id as string,
				pseudonym: `ps${user.id}`,
			});

			nextCloudUserId = `prefix-${pseudonymDo.pseudonym}`;
			groupId = 'groupId';
		});

		it('should add one user to group in nextcloud if added in sc team', async () => {
			// Arrange
			client.getGroupUsers.mockResolvedValue([]);
			pseudonymsRepo.findByUserIdAndToolId.mockResolvedValue(pseudonymDo);
			client.getNameWithPrefix.mockReturnValue(nextCloudUserId);

			// Act
			await strategy.specUpdateTeamUsersInGroup(groupId, teamUsers);

			// Assert
			expect(client.getGroupUsers).toHaveBeenCalledWith(groupId);
			expect(ltiToolRepo.findByName).toHaveBeenCalledWith(nextcloudTool.name);
			expect(pseudonymsRepo.findByUserIdAndToolId).toHaveBeenCalledWith(teamUsers[0].userId, pseudonymDo.toolId);
			expect(client.getNameWithPrefix).toHaveBeenCalledWith(pseudonymDo.pseudonym);
			expect(client.removeUserFromGroup).not.toHaveBeenCalled();
			expect(client.addUserToGroup).toHaveBeenCalledWith(nextCloudUserId, groupId);
		});

		it('should remove one user from group in nextcloud if not exist in sc team', async () => {
			// Arrange
			client.getGroupUsers.mockResolvedValue([nextCloudUserId]);
			teamUsers = [];

			// Act
			await strategy.specUpdateTeamUsersInGroup(groupId, teamUsers);

			// Assert
			expect(client.getGroupUsers).toHaveBeenCalledWith(groupId);
			expect(pseudonymsRepo.findByUserIdAndToolId).not.toHaveBeenCalled();
			expect(client.getNameWithPrefix).not.toHaveBeenCalled();
			expect(client.removeUserFromGroup).toHaveBeenCalledWith(nextCloudUserId, groupId);
			expect(client.addUserToGroup).not.toHaveBeenCalled();
		});

		it('should not add or remove if no pseudonym found', async () => {
			// Arrange
			teamUsers = [
				{ userId: user.id, schoolId: user.school.id, roleId: user.roles[0].id },
				{ userId: 'invalidId', schoolId: 'someSchool', roleId: 'someRole' },
			];

			client.getGroupUsers.mockResolvedValue([nextCloudUserId]);
			pseudonymsRepo.findByUserIdAndToolId.mockResolvedValueOnce(pseudonymDo).mockRejectedValueOnce(undefined);
			client.getNameWithPrefix.mockReturnValue(nextCloudUserId);

			// Act
			await strategy.specUpdateTeamUsersInGroup(groupId, teamUsers);

			// Assert
			expect(client.addUserToGroup).not.toHaveBeenCalled();
			expect(client.removeUserFromGroup).not.toHaveBeenCalled();
		});
	});

	describe('generateGroupFolderName', () => {
		// Arrange
		const teamId = 'teamId';
		const teamName = 'teamName';

		// Act
		const folderName: string = NextcloudStrategySpec.specGenerateGroupFolderName(teamId, teamName);

		// Assert
		expect(folderName).toEqual(`${teamName} (${teamId})`);
	});

	describe('generateGroupId', () => {
		it('should return concatenated groupId', () => {
			// Arrange
			const dto: TeamRolePermissionsDto = {
				teamId: 'teamId',
				teamName: 'teamName',
				roleName: 'roleName',
				permissions: [],
			};

			// Act
			const groupId: string = NextcloudStrategySpec.specGenerateGroupId(dto);

			// Assert
			expect(groupId).toEqual(`${dto.teamName}-${dto.teamId}-${dto.roleName}`);
		});
	});
});
