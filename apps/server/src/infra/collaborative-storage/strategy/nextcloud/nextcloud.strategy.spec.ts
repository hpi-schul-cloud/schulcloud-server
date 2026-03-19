import { LegacyLogger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { TeamDto, TeamUserDto } from '@modules/collaborative-storage/services/dto/team.dto';
import { PseudonymService } from '@modules/pseudonym';
import { Pseudonym } from '@modules/pseudonym/repo';
import { pseudonymFactory } from '@modules/pseudonym/testing';
import { RoleName } from '@modules/role';
import { ExternalToolService } from '@modules/tool/external-tool/service';
import { externalToolFactory } from '@modules/tool/external-tool/testing';
import { UserService } from '@modules/user';
import { User } from '@modules/user/repo';
import { userDoFactory, userFactory } from '@modules/user/testing';
import { UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { setupEntities } from '@testing/database';
import { InternalCollaborativeStorageAdapterConfig } from '../../collaborative-storage-adapter.config';
import { TeamRolePermissionsDto } from '../../dto/team-role-permissions.dto';
import { NextcloudClient } from './nextcloud.client';
import { NextcloudStrategy } from './nextcloud.strategy';

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

describe('NextCloudStrategy', () => {
	let module: TestingModule;
	let strategy: NextcloudStrategySpec;

	let logger: DeepMocked<LegacyLogger>;
	let client: DeepMocked<NextcloudClient>;
	let pseudonymService: DeepMocked<PseudonymService>;
	let userService: DeepMocked<UserService>;
	let externalToolService: DeepMocked<ExternalToolService>;

	const toolName = 'SchulcloudNextcloud';

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				{
					provide: NextcloudClient,
					useValue: createMock<NextcloudClient>(),
				},
				{
					provide: PseudonymService,
					useValue: createMock<PseudonymService>(),
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

		logger = module.get(LegacyLogger);
		client = module.get(NextcloudClient);
		pseudonymService = module.get(PseudonymService);
		userService = module.get(UserService);
		externalToolService = module.get(ExternalToolService);
		const config = {} as InternalCollaborativeStorageAdapterConfig;

		strategy = new NextcloudStrategySpec(logger, client, pseudonymService, externalToolService, userService, config);

		await setupEntities([User]);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	beforeEach(() => {});

	describe('updateTeamPermissionsForRole', () => {
		describe('when nextcloud group can be found', () => {
			const setup = () => {
				const teamRolePermissionsDto: TeamRolePermissionsDto = {
					teamId: 'teamId',
					teamName: 'teamName',
					roleName: 'roleName',
					permissions: [],
				};

				const groupId = 'groupId';
				const folderId = 1;

				client.findGroupId.mockResolvedValueOnce(groupId);
				client.findGroupFolderIdForGroupId.mockResolvedValueOnce(folderId);

				return { teamRolePermissionsDto, groupId };
			};

			it('call clients findGroupId', async () => {
				const { teamRolePermissionsDto } = setup();

				await strategy.updateTeamPermissionsForRole(teamRolePermissionsDto);

				expect(client.findGroupId).toHaveBeenCalledWith(
					NextcloudStrategySpec.specGenerateGroupId(teamRolePermissionsDto)
				);
			});

			it('call clients findGroupFolderIdForGroupId', async () => {
				const { teamRolePermissionsDto, groupId } = setup();

				await strategy.updateTeamPermissionsForRole(teamRolePermissionsDto);

				expect(client.findGroupFolderIdForGroupId).toHaveBeenCalledWith(groupId);
			});
		});

		describe('when nextcloud group can not be found', () => {
			const setup = () => {
				const teamRolePermissionsDto: TeamRolePermissionsDto = {
					teamId: 'teamId',
					teamName: 'teamName',
					roleName: 'roleName',
					permissions: [],
				};

				const groupId = 'groupId';

				client.findGroupId.mockResolvedValueOnce(groupId);
				client.findGroupFolderIdForGroupId.mockRejectedValueOnce(new Error('some nextcloud error'));

				return { teamRolePermissionsDto, groupId };
			};

			it('call clients findGroupId', async () => {
				const { teamRolePermissionsDto } = setup();

				await strategy.updateTeamPermissionsForRole(teamRolePermissionsDto);

				expect(client.findGroupId).toHaveBeenCalledWith(
					NextcloudStrategySpec.specGenerateGroupId(teamRolePermissionsDto)
				);
			});

			it('call clients findGroupFolderIdForGroupId', async () => {
				const { teamRolePermissionsDto, groupId } = setup();

				await strategy.updateTeamPermissionsForRole(teamRolePermissionsDto);

				expect(client.findGroupFolderIdForGroupId).toHaveBeenCalledWith(groupId);
			});
		});
	});

	describe('deleteTeam', () => {
		const setup = () => {
			const groupId = 'groupId';
			const teamId = 'teamId';
			const folderId = 1;

			client.getNameWithPrefix.mockReturnValue(groupId);
			client.findGroupFolderIdForGroupId.mockResolvedValue(folderId);

			return { groupId, teamId, folderId };
		};

		it('should call clients findGroupFolderIdForGroupId', async () => {
			const { groupId, teamId } = setup();

			await strategy.deleteTeam(teamId);

			expect(client.findGroupFolderIdForGroupId).toHaveBeenCalledWith(groupId);
		});

		it('should call clients deleteGroup', async () => {
			const { groupId, teamId } = setup();

			await strategy.deleteTeam(teamId);

			expect(client.deleteGroup).toHaveBeenCalledWith(groupId);
		});

		it('should call clients deleteGroupFolder', async () => {
			const { teamId, folderId } = setup();

			await strategy.deleteTeam(teamId);

			expect(client.deleteGroupFolder).toHaveBeenCalledWith(folderId);
		});
	});

	describe('createTeam', () => {
		const setup = () => {
			const groupId = 'groupdId';
			const userId = 'userId';
			const teamDto: TeamDto = {
				teamUsers: [{ userId, schoolId: 'schoolId', roleId: 'roleId' }],
				id: 'id',
				name: 'name',
			};
			const folderId = 1;

			const externalTool = externalToolFactory.withOauth2Config().build({ name: toolName });
			externalToolService.findExternalToolByName.mockResolvedValueOnce(externalTool);
			client.getNameWithPrefix.mockReturnValue(groupId);
			pseudonymService.findByUserAndToolOrThrow.mockRejectedValueOnce(undefined);
			client.findGroupFolderIdForGroupId.mockResolvedValue(folderId);
			client.getGroupUsers.mockResolvedValue([userId]);

			return { groupId, teamDto, folderId };
		};

		it('should call clients createGroup', async () => {
			const { groupId, teamDto } = setup();

			await strategy.createTeam(teamDto);

			expect(client.createGroup).toHaveBeenCalledWith(groupId, teamDto.name);
		});

		it('should call clients findGroupFolderIdForGroupId', async () => {
			const { groupId, teamDto } = setup();

			await strategy.createTeam(teamDto);

			expect(client.findGroupFolderIdForGroupId).toHaveBeenCalledWith(groupId);
		});

		it('should call clients changeGroupFolderName', async () => {
			const { teamDto, folderId } = setup();

			await strategy.createTeam(teamDto);

			expect(client.changeGroupFolderName).toHaveBeenCalledWith(folderId, `${teamDto.name} (${teamDto.id})`);
		});
	});

	describe('updateTeam', () => {
		describe('when teamId is missing', () => {
			const setup = () => {
				const teamDto: TeamDto = {
					teamUsers: [{ userId: 'userId', schoolId: 'schoolId', roleId: 'roleId' }],
					id: '',
					name: 'name',
				};

				return { teamDto };
			};

			it('should throw error', async () => {
				const { teamDto } = setup();

				await expect(strategy.updateTeam(teamDto)).rejects.toThrow(UnprocessableEntityException);
			});
		});

		describe('when team user and name exists', () => {
			const setup = () => {
				const teamDto: TeamDto = {
					teamUsers: [{ userId: 'userId', schoolId: 'schoolId', roleId: 'roleId' }],
					id: 'id',
					name: 'name',
				};
				const nextCloudUserId = 'nextcloudUserId';
				const folderId = 1;
				const groupId = 'groupId';

				const externalTool = externalToolFactory.withOauth2Config().build({ name: toolName });
				externalToolService.findExternalToolByName.mockResolvedValueOnce(externalTool);
				client.getNameWithPrefix.mockReturnValue(groupId);
				client.getGroupUsers.mockResolvedValue([nextCloudUserId]);
				pseudonymService.findByUserAndToolOrThrow.mockRejectedValueOnce(undefined);
				client.findGroupFolderIdForGroupId.mockResolvedValueOnce(folderId);

				const expectedFolderName: string = NextcloudStrategySpec.specGenerateGroupFolderName(teamDto.id, teamDto.name);

				return { teamDto, folderId, groupId, expectedFolderName };
			};

			it('should call clients renameGroup', async () => {
				const { teamDto, groupId } = setup();

				await strategy.updateTeam(teamDto);

				expect(client.renameGroup).toHaveBeenCalledWith(groupId, teamDto.name);
			});

			it('should call clients changeGroupFolderName', async () => {
				const { teamDto, folderId, expectedFolderName } = setup();

				await strategy.updateTeam(teamDto);

				expect(client.changeGroupFolderName).toHaveBeenCalledWith(folderId, expectedFolderName);
			});
		});

		describe('when team user does not exist', () => {
			const setup = () => {
				const teamDto: TeamDto = {
					teamUsers: [],
					id: 'teamId',
					name: '',
				};

				client.getNameWithPrefix.mockReturnValue('groupId');

				return { teamDto };
			};

			it('should not call clients getGroupUsers', async () => {
				const { teamDto } = setup();

				await strategy.updateTeam(teamDto);

				expect(client.getGroupUsers).not.toHaveBeenCalled();
			});

			it('should not call clients findGroupFolderIdForGroupId', async () => {
				const { teamDto } = setup();

				await strategy.updateTeam(teamDto);

				expect(client.findGroupFolderIdForGroupId).not.toHaveBeenCalled();
			});

			it('should not call clients renameGroup', async () => {
				const { teamDto } = setup();

				await strategy.updateTeam(teamDto);

				expect(client.renameGroup).not.toHaveBeenCalled();
			});

			it('should not call clients changeGroupFolderName', async () => {
				const { teamDto } = setup();

				await strategy.updateTeam(teamDto);

				expect(client.changeGroupFolderName).not.toHaveBeenCalled();
			});
		});
	});

	describe('updateTeamUsersInGroup', () => {
		describe('when user was added to a team', () => {
			const setup = () => {
				const user = userFactory.withRoleByName(RoleName.TEAMMEMBER).buildWithId();
				const userDo = userDoFactory.build({ id: user.id });
				const teamUsers: TeamUserDto[] = [{ userId: user.id, schoolId: user.school.id, roleId: user.roles[0].id }];
				const externalTool = externalToolFactory.withOauth2Config().build({ name: toolName });

				const pseudonym = pseudonymFactory.build({
					userId: user.id,
					toolId: externalTool.id,
					pseudonym: `ps${user.id}`,
				});

				const nextCloudUserId = `prefix-${pseudonym.pseudonym}`;
				const groupId = 'groupId';

				externalToolService.findExternalToolByName.mockResolvedValueOnce(externalTool);
				client.getGroupUsers.mockResolvedValue([]);
				pseudonymService.findByUserAndToolOrThrow.mockResolvedValue(pseudonym);
				client.getNameWithPrefix.mockReturnValue(nextCloudUserId);
				userService.findById.mockResolvedValue(userDo);

				return {
					user,
					teamUsers,
					pseudonym,
					nextCloudUserId,
					groupId,
					userDo,
					externalTool,
				};
			};

			it('should call clients getGroupUsers', async () => {
				const { teamUsers, groupId } = setup();

				await strategy.specUpdateTeamUsersInGroup(groupId, teamUsers);

				expect(client.getGroupUsers).toHaveBeenCalledWith(groupId);
			});

			it('should call clients pseudonymService.findByUserAndTool', async () => {
				const { teamUsers, groupId, userDo, externalTool } = setup();

				await strategy.specUpdateTeamUsersInGroup(groupId, teamUsers);

				expect(pseudonymService.findByUserAndToolOrThrow).toHaveBeenCalledWith(userDo, externalTool);
			});

			it('should call userService.findById', async () => {
				const { user, teamUsers, groupId } = setup();

				await strategy.specUpdateTeamUsersInGroup(groupId, teamUsers);

				expect(userService.findById).toHaveBeenCalledWith(user.id);
			});

			it('should call clients getNameWithPrefix', async () => {
				const { teamUsers, pseudonym, groupId } = setup();

				await strategy.specUpdateTeamUsersInGroup(groupId, teamUsers);

				expect(client.getNameWithPrefix).toHaveBeenCalledWith(pseudonym.pseudonym);
			});

			it('should call clients removeUserFromGroup', async () => {
				const { teamUsers, groupId } = setup();

				await strategy.specUpdateTeamUsersInGroup(groupId, teamUsers);

				expect(client.removeUserFromGroup).not.toHaveBeenCalled();
			});

			it('should call clients addUserToGroup', async () => {
				const { teamUsers, nextCloudUserId, groupId } = setup();

				await strategy.specUpdateTeamUsersInGroup(groupId, teamUsers);

				expect(client.addUserToGroup).toHaveBeenCalledWith(nextCloudUserId, groupId);
			});
		});

		describe('when user was removed from a team', () => {
			const setup = () => {
				const user = userFactory.withRoleByName(RoleName.TEAMMEMBER).buildWithId();
				const teamUsers: TeamUserDto[] = [];
				const externalTool = externalToolFactory.withOauth2Config().build({ name: toolName });

				const pseudonym: Pseudonym = pseudonymFactory.build({
					userId: user.id,
					toolId: externalTool.id,
					pseudonym: `ps${user.id}`,
				});

				const nextCloudUserId = `prefix-${pseudonym.pseudonym}`;
				const groupId = 'groupId';

				externalToolService.findExternalToolByName.mockResolvedValueOnce(externalTool);
				client.getGroupUsers.mockResolvedValue([nextCloudUserId]);
				pseudonymService.findByUserAndToolOrThrow.mockResolvedValue(pseudonym);
				client.getNameWithPrefix.mockReturnValue(nextCloudUserId);

				return { teamUsers, nextCloudUserId, groupId };
			};

			it('should call clients getGroupUsers', async () => {
				const { teamUsers, groupId } = setup();

				await strategy.specUpdateTeamUsersInGroup(groupId, teamUsers);

				expect(client.getGroupUsers).toHaveBeenCalledWith(groupId);
			});

			it('should not call pseudonymService.findByUserAndTool', async () => {
				const { teamUsers, groupId } = setup();

				await strategy.specUpdateTeamUsersInGroup(groupId, teamUsers);

				expect(pseudonymService.findByUserAndToolOrThrow).not.toHaveBeenCalled();
			});

			it('should not call clients getNameWithPrefix', async () => {
				const { teamUsers, groupId } = setup();

				await strategy.specUpdateTeamUsersInGroup(groupId, teamUsers);

				expect(client.getNameWithPrefix).not.toHaveBeenCalled();
			});

			it('should not call clients removeUserFromGroup', async () => {
				const { teamUsers, nextCloudUserId, groupId } = setup();

				await strategy.specUpdateTeamUsersInGroup(groupId, teamUsers);

				expect(client.removeUserFromGroup).toHaveBeenCalledWith(nextCloudUserId, groupId);
			});

			it('should not call clients addUserToGroup', async () => {
				const { teamUsers, groupId } = setup();

				await strategy.specUpdateTeamUsersInGroup(groupId, teamUsers);

				expect(client.addUserToGroup).not.toHaveBeenCalled();
			});
		});

		describe('when no pseudonym for the user was found', () => {
			const setup = () => {
				const user = userFactory.withRoleByName(RoleName.TEAMMEMBER).buildWithId();
				const teamUsers: TeamUserDto[] = [
					{ userId: user.id, schoolId: user.school.id, roleId: user.roles[0].id },
					{ userId: 'invalidId', schoolId: 'someSchool', roleId: 'someRole' },
				];
				const externalTool = externalToolFactory.withOauth2Config().build({ name: toolName });

				const pseudonym: Pseudonym = pseudonymFactory.build({
					userId: user.id,
					toolId: externalTool.id,
					pseudonym: `ps${user.id}`,
				});

				const nextCloudUserId = `prefix-${pseudonym.pseudonym}`;
				const groupId = 'groupId';

				externalToolService.findExternalToolByName.mockResolvedValueOnce(externalTool);
				client.getGroupUsers.mockResolvedValue([nextCloudUserId]);
				pseudonymService.findByUserAndToolOrThrow.mockResolvedValueOnce(pseudonym).mockRejectedValueOnce(undefined);
				client.getNameWithPrefix.mockReturnValue(nextCloudUserId);

				return { teamUsers, groupId };
			};

			it('should not clients addUserToGroup', async () => {
				const { teamUsers, groupId } = setup();

				await strategy.specUpdateTeamUsersInGroup(groupId, teamUsers);

				expect(client.addUserToGroup).not.toHaveBeenCalled();
			});

			it('should not call clients removeUserFromGroup', async () => {
				const { teamUsers, groupId } = setup();

				await strategy.specUpdateTeamUsersInGroup(groupId, teamUsers);

				expect(client.removeUserFromGroup).not.toHaveBeenCalled();
			});
		});

		describe('when the external tool was not found', () => {
			const setup = () => {
				const user = userFactory.withRoleByName(RoleName.TEAMMEMBER).buildWithId();
				const teamUsers: TeamUserDto[] = [{ userId: user.id, schoolId: user.school.id, roleId: user.roles[0].id }];

				const groupId = 'groupId';

				externalToolService.findExternalToolByName.mockResolvedValueOnce(null);

				return { user, teamUsers, groupId };
			};

			it('should throw not found', async () => {
				const { groupId, teamUsers } = setup();

				await expect(strategy.specUpdateTeamUsersInGroup(groupId, teamUsers)).rejects.toThrow(
					NotFoundLoggableException
				);
			});
		});
	});

	describe('generateGroupFolderName', () => {
		const setup = () => {
			const teamId = 'teamId';
			const teamName = 'teamName';

			return { teamId, teamName };
		};

		it('should return concatenated teamName and teamId', () => {
			const { teamId, teamName } = setup();

			const folderName: string = NextcloudStrategySpec.specGenerateGroupFolderName(teamId, teamName);

			expect(folderName).toEqual(`${teamName} (${teamId})`);
		});
	});

	describe('generateGroupId', () => {
		const setup = () => {
			const dto: TeamRolePermissionsDto = {
				teamId: 'teamId',
				teamName: 'teamName',
				roleName: 'roleName',
				permissions: [],
			};

			return { dto };
		};

		it('should return concatenated groupId', () => {
			const { dto } = setup();

			const groupId: string = NextcloudStrategySpec.specGenerateGroupId(dto);

			expect(groupId).toEqual(`${dto.teamName}-${dto.teamId}-${dto.roleName}`);
		});
	});
});
