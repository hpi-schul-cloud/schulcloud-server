import { Logger } from '@core/logger';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { RoleService } from '@modules/role';
import { School, SchoolService } from '@modules/school/domain';
import { UserDo, UserService } from '@modules/user';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { ReferencedEntityNotFoundLoggable } from '@shared/common/loggable';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions, Permission, SortOrder } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { Group, GroupUser, GroupVisibilityPermission } from '../domain';
import { GroupService } from '../service';
import { ResolvedGroupDto, ResolvedGroupUser } from './dto';
import { GroupUcMapper } from './mapper/group-uc.mapper';

@Injectable()
export class GroupUc {
	constructor(
		private readonly groupService: GroupService,
		private readonly userService: UserService,
		private readonly roleService: RoleService,
		private readonly schoolService: SchoolService,
		private readonly authorizationService: AuthorizationService,
		private readonly logger: Logger
	) {}

	public async getGroup(userId: EntityId, groupId: EntityId): Promise<ResolvedGroupDto> {
		const group = await this.groupService.findById(groupId);
		const user = await this.authorizationService.getUserWithPermissions(userId);

		this.authorizationService.checkPermission(user, group, AuthorizationContextBuilder.read([Permission.GROUP_VIEW]));

		const resolvedUsers = await this.findUsersForGroup(group);
		const resolvedGroup = GroupUcMapper.mapToResolvedGroupDto(group, resolvedUsers);

		return resolvedGroup;
	}

	private async findUsersForGroup(group: Group): Promise<ResolvedGroupUser[]> {
		const resolvedGroupUsersOrNull = await Promise.all(
			group.users.map(async (groupUser: GroupUser): Promise<ResolvedGroupUser | null> => {
				const user = await this.userService.findByIdOrNull(groupUser.userId);
				let resolvedGroup: ResolvedGroupUser | null = null;

				if (!user) {
					this.logger.warning(
						new ReferencedEntityNotFoundLoggable(Group.name, group.id, UserDo.name, groupUser.userId)
					);
				} else {
					const role = await this.roleService.findById(groupUser.roleId);

					resolvedGroup = new ResolvedGroupUser({
						user,
						role,
					});
				}

				return resolvedGroup;
			})
		);

		const resolvedGroupUsers = resolvedGroupUsersOrNull.filter(
			(resolvedGroupUser: ResolvedGroupUser | null): resolvedGroupUser is ResolvedGroupUser =>
				resolvedGroupUser !== null
		);

		return resolvedGroupUsers;
	}

	public async getAllGroups(
		userId: EntityId,
		schoolId: EntityId,
		options: IFindOptions<Group> = {},
		nameQuery?: string,
		availableGroupsForCourseSync?: boolean
	): Promise<Page<ResolvedGroupDto>> {
		const school = await this.schoolService.getSchoolById(schoolId);

		const user = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(user, school, AuthorizationContextBuilder.read([Permission.GROUP_VIEW]));

		const groupVisibilityPermission = this.getGroupVisibilityPermission(user, school);

		options.order = { name: SortOrder.asc };

		const groups = await this.groupService.findGroupsForUser(
			user,
			groupVisibilityPermission,
			!!availableGroupsForCourseSync,
			nameQuery,
			options
		);

		const resolvedGroups = await Promise.all(
			groups.data.map(async (group: Group) => {
				const resolvedUsers = await this.findUsersForGroup(group);
				const resolvedGroup = GroupUcMapper.mapToResolvedGroupDto(group, resolvedUsers);

				return resolvedGroup;
			})
		);

		const page = new Page<ResolvedGroupDto>(resolvedGroups, groups.total);

		return page;
	}

	private getGroupVisibilityPermission(user: User, school: School): GroupVisibilityPermission {
		const canSeeAllSchoolGroups =
			this.authorizationService.hasAllPermissions(user, [Permission.GROUP_FULL_ADMIN]) ||
			this.authorizationService.hasPermission(
				user,
				school,
				AuthorizationContextBuilder.read([Permission.STUDENT_LIST])
			);

		if (canSeeAllSchoolGroups) {
			return GroupVisibilityPermission.ALL_SCHOOL_GROUPS;
		}

		return GroupVisibilityPermission.OWN_GROUPS;
	}
}
