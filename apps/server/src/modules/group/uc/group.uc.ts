import { Injectable } from '@nestjs/common';
import { EntityId, LegacySchoolDo, Page, Permission, SortOrder, User, UserDO } from '@shared/domain';
import { AuthorizationContextBuilder, AuthorizationService } from '@src/modules/authorization';
import { ClassService } from '@src/modules/class';
import { Class } from '@src/modules/class/domain';
import { LegacySchoolService } from '@src/modules/legacy-school';
import { RoleService } from '@src/modules/role';
import { RoleDto } from '@src/modules/role/service/dto/role.dto';
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
		private readonly schoolService: LegacySchoolService,
		private readonly authorizationService: AuthorizationService
	) {}

	public async findAllClassesForSchool(
		userId: EntityId,
		schoolId: EntityId,
		skip = 0,
		limit?: number,
		sortBy: keyof ClassInfoDto = 'name',
		sortOrder: SortOrder = SortOrder.asc
	): Promise<Page<ClassInfoDto>> {
		const school: LegacySchoolDo = await this.schoolService.getSchoolById(schoolId);

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(user, school, AuthorizationContextBuilder.read([Permission.CLASS_LIST]));

		let combinedClassInfo: ClassInfoDto[] = await this.findCombinedClassListForSchool(schoolId);

		combinedClassInfo = combinedClassInfo.sort((a: ClassInfoDto, b: ClassInfoDto): number =>
			SortHelper.genericSortFunction(a[sortBy], b[sortBy], sortOrder)
		);

		const pageContent: ClassInfoDto[] = combinedClassInfo.slice(skip, limit ? skip + limit : combinedClassInfo.length);

		const page: Page<ClassInfoDto> = new Page<ClassInfoDto>(pageContent, combinedClassInfo.length);

		return page;
	}

	private async findCombinedClassListForSchool(schoolId: string): Promise<ClassInfoDto[]> {
		const [classInfosFromClasses, classInfosFromGroups] = await Promise.all([
			await this.findClassesForSchool(schoolId),
			await this.findGroupsOfTypeClassForSchool(schoolId),
		]);

		const combinedClassInfo: ClassInfoDto[] = [...classInfosFromClasses, ...classInfosFromGroups];

		return combinedClassInfo;
	}

	private async findClassesForSchool(schoolId: EntityId): Promise<ClassInfoDto[]> {
		const classes: Class[] = await this.classService.findClassesForSchool(schoolId);

		const classInfosFromClasses: ClassInfoDto[] = await Promise.all(
			classes.map(async (clazz: Class): Promise<ClassInfoDto> => {
				const teachers: UserDO[] = await Promise.all(
					clazz.teacherIds.map((teacherId: EntityId) => this.userService.findById(teacherId))
				);

				const mapped: ClassInfoDto = GroupUcMapper.mapClassToClassInfoDto(clazz, teachers);

				return mapped;
			})
		);

		return classInfosFromClasses;
	}

	private async findGroupsOfTypeClassForSchool(schoolId: EntityId): Promise<ClassInfoDto[]> {
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

		return classInfosFromGroups;
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

				const resolvedGroups = new ResolvedGroupUser({
					user,
					role,
				});

				return resolvedGroups;
			})
		);

		return resolvedGroupUsers;
	}
}
