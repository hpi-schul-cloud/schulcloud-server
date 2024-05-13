import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { ProvisioningConfig } from '@modules/provisioning';
import { RoleDto, RoleService } from '@modules/role';
import { School, SchoolService } from '@modules/school/domain';
import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ReferencedEntityNotFoundLoggable } from '@shared/common/loggable';
import { Page, UserDO } from '@shared/domain/domainobject';
import { User } from '@shared/domain/entity';
import { IFindOptions, Permission, SortOrder } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import { Group, GroupFilter, GroupUser } from '../domain';
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
		private readonly configService: ConfigService<ProvisioningConfig, true>,
		private readonly logger: Logger
	) {}

	public async getGroup(userId: EntityId, groupId: EntityId): Promise<ResolvedGroupDto> {
		const group: Group = await this.groupService.findById(groupId);
		const user: User = await this.authorizationService.getUserWithPermissions(userId);

		this.authorizationService.checkPermission(user, group, AuthorizationContextBuilder.read([Permission.GROUP_VIEW]));

		const resolvedUsers: ResolvedGroupUser[] = await this.findUsersForGroup(group);
		const resolvedGroup: ResolvedGroupDto = GroupUcMapper.mapToResolvedGroupDto(group, resolvedUsers);

		return resolvedGroup;
	}

	private async findUsersForGroup(group: Group): Promise<ResolvedGroupUser[]> {
		const resolvedGroupUsersOrNull: (ResolvedGroupUser | null)[] = await Promise.all(
			group.users.map(async (groupUser: GroupUser): Promise<ResolvedGroupUser | null> => {
				const user: UserDO | null = await this.userService.findByIdOrNull(groupUser.userId);
				let resolvedGroup: ResolvedGroupUser | null = null;

				if (!user) {
					this.logger.warning(
						new ReferencedEntityNotFoundLoggable(Group.name, group.id, UserDO.name, groupUser.userId)
					);
				} else {
					const role: RoleDto = await this.roleService.findById(groupUser.roleId);

					resolvedGroup = new ResolvedGroupUser({
						user,
						role,
					});
				}

				return resolvedGroup;
			})
		);

		const resolvedGroupUsers: ResolvedGroupUser[] = resolvedGroupUsersOrNull.filter(
			(resolvedGroupUser: ResolvedGroupUser | null): resolvedGroupUser is ResolvedGroupUser =>
				resolvedGroupUser !== null
		);

		return resolvedGroupUsers;
	}

	public async getAllGroups(
		userId: EntityId,
		schoolId: EntityId,
		options: IFindOptions<Group> = { pagination: { skip: 0 } },
		nameQuery?: string,
		availableGroupsForCourseSync?: boolean
	): Promise<Page<ResolvedGroupDto>> {
		const school: School = await this.schoolService.getSchoolById(schoolId);

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(user, school, AuthorizationContextBuilder.read([Permission.GROUP_VIEW]));

		const canSeeFullList: boolean = this.authorizationService.hasAllPermissions(user, [Permission.GROUP_FULL_ADMIN]);

		const filter: GroupFilter = { nameQuery };
		options.order = { name: SortOrder.asc };

		if (canSeeFullList) {
			filter.schoolId = schoolId;
		} else {
			filter.userId = userId;
		}

		const groups: Page<Group> = await this.getGroups(filter, options, availableGroupsForCourseSync);

		const resolvedGroups: ResolvedGroupDto[] = await Promise.all(
			groups.data.map(async (group: Group) => {
				const resolvedUsers: ResolvedGroupUser[] = await this.findUsersForGroup(group);
				const resolvedGroup: ResolvedGroupDto = GroupUcMapper.mapToResolvedGroupDto(group, resolvedUsers);

				return resolvedGroup;
			})
		);

		const page: Page<ResolvedGroupDto> = new Page<ResolvedGroupDto>(resolvedGroups, groups.total);

		return page;
	}

	private async getGroups(
		filter: GroupFilter,
		options: IFindOptions<Group>,
		availableGroupsForCourseSync?: boolean
	): Promise<Page<Group>> {
		let foundGroups: Page<Group>;
		if (availableGroupsForCourseSync && this.configService.get('FEATURE_SCHULCONNEX_COURSE_SYNC_ENABLED')) {
			foundGroups = await this.groupService.findAvailableGroups(filter, options);
		} else {
			foundGroups = await this.groupService.findGroups(filter, options);
		}

		return foundGroups;
	}
}
