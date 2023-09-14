import { Injectable } from '@nestjs/common';
import { EntityId, Permission, SchoolDO, SortOrder, User, UserDO } from '@shared/domain';
import { AuthorizationContextBuilder, AuthorizationService } from '@src/modules/authorization';
import { ClassService } from '@src/modules/class';
import { Class } from '@src/modules/class/domain';
import { RoleService } from '@src/modules/role';
import { RoleDto } from '@src/modules/role/service/dto/role.dto';
import { SchoolService } from '@src/modules/school';
import { SystemDto, SystemService } from '@src/modules/system';
import { UserService } from '@src/modules/user';
import { Group, GroupUser } from '../domain';
import { GroupService } from '../service';
import { SortHelper } from '../util';
import { ClassInfoDto, ResolvedGroupUser } from './dto';
import { GroupUcMapper } from './mapper/group-uc.mapper';

@Injectable()
export class GroupUc {
	constructor(
		private readonly groupService: GroupService,
		private readonly classService: ClassService,
		private readonly systemService: SystemService,
		private readonly userService: UserService,
		private readonly roleService: RoleService,
		private readonly schoolService: SchoolService,
		private readonly authorizationService: AuthorizationService
	) {}

	public async findClassesForSchool(
		userId: EntityId,
		schoolId: EntityId,
		skip = 0,
		limit?: number,
		sortBy: keyof ClassInfoDto = 'name',
		sortOrder: SortOrder = SortOrder.asc
	): Promise<ClassInfoDto[]> {
		const school: SchoolDO = await this.schoolService.getSchoolById(schoolId);

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(user, school, AuthorizationContextBuilder.read([Permission.CLASS_LIST]));

		let combinedClassInfo: ClassInfoDto[] = await this.findCombinedClassListForSchool(schoolId);

		combinedClassInfo = combinedClassInfo.sort((a: ClassInfoDto, b: ClassInfoDto): number =>
			SortHelper.genericSortFunction(a[sortBy], b[sortBy], sortOrder)
		);

		combinedClassInfo = combinedClassInfo.slice(skip, limit ? skip + limit : combinedClassInfo.length);

		return combinedClassInfo;
	}

	private async findCombinedClassListForSchool(schoolId: string) {
		const classes: Class[] = await this.classService.findClassesForSchool(schoolId);
		const groupsOfTypeClass: Group[] = await this.groupService.findClassesForSchool(schoolId);

		const systemMap: Map<EntityId, SystemDto> = await this.findSystemNamesForGroups(groupsOfTypeClass);

		const classInfosFromGroups: ClassInfoDto[] = await Promise.all(
			groupsOfTypeClass.map(async (group: Group): Promise<ClassInfoDto> => {
				let system: SystemDto | undefined;
				if (group.externalSource) {
					system = systemMap.get(group.externalSource.systemId);
				}

				const resolvedUsers: ResolvedGroupUser[] = await this.findUsersForGroup(group);

				const mapped: ClassInfoDto = GroupUcMapper.mapGroupToClassInfoDto(group, resolvedUsers, system);

				return mapped;
			})
		);

		const classInfosFromClasses: ClassInfoDto[] = await Promise.all(
			classes.map(async (clazz: Class): Promise<ClassInfoDto> => {
				const teachers: UserDO[] = await Promise.all(
					clazz.teacherIds.map((teacherId: EntityId) => this.userService.findById(teacherId))
				);

				const mapped: ClassInfoDto = GroupUcMapper.mapClassToClassInfoDto(clazz, teachers);

				return mapped;
			})
		);

		const combinedClassInfo: ClassInfoDto[] = [...classInfosFromGroups, ...classInfosFromClasses];

		return combinedClassInfo;
	}

	private async findSystemNamesForGroups(groups: Group[]): Promise<Map<EntityId, SystemDto>> {
		const systemIds: EntityId[] = groups
			.map((group: Group): string | undefined => group.externalSource?.systemId)
			.filter((systemId: string | undefined): systemId is EntityId => systemId !== undefined);

		const uniqueSystemIds: EntityId[] = Array.from(new Set(systemIds));

		const systems: Map<EntityId, SystemDto> = new Map<EntityId, SystemDto>();

		await Promise.all(
			uniqueSystemIds.map(async (systemId: string) => {
				const system: SystemDto = await this.systemService.findById(systemId);

				systems.set(systemId, system);
			})
		);

		return systems;
	}

	private async findUsersForGroup(group: Group): Promise<ResolvedGroupUser[]> {
		const resolvedGroupUsers: ResolvedGroupUser[] = await Promise.all(
			group.users.map(async (groupUser: GroupUser): Promise<ResolvedGroupUser> => {
				const user: UserDO = await this.userService.findById(groupUser.userId);
				const role: RoleDto = await this.roleService.findById(groupUser.roleId);

				return new ResolvedGroupUser({
					user,
					role,
				});
			})
		);

		return resolvedGroupUsers;
	}
}
