import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { ClassService } from '@modules/class';
import { Class } from '@modules/class/domain';
import { LegacySchoolService, SchoolYearService } from '@modules/legacy-school';
import { RoleService } from '@modules/role';
import { RoleDto } from '@modules/role/service/dto/role.dto';
import { SystemDto, SystemService } from '@modules/system';
import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { EntityId, LegacySchoolDo, Page, Permission, SchoolYearEntity, SortOrder, User, UserDO } from '@shared/domain';
import { Group, GroupUser } from '../domain';
import { GroupService } from '../service';
import { SortHelper } from '../util';
import { ClassInfoDto, ResolvedGroupDto, ResolvedGroupUser } from './dto';
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
		private readonly authorizationService: AuthorizationService,
		private readonly schoolYearService: SchoolYearService
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
		this.authorizationService.checkPermission(
			user,
			school,
			AuthorizationContextBuilder.read([Permission.CLASS_VIEW, Permission.GROUP_VIEW])
		);

		const canSeeFullList: boolean = this.authorizationService.hasAllPermissions(user, [
			Permission.CLASS_LIST,
			Permission.GROUP_LIST,
		]);

		let combinedClassInfo: ClassInfoDto[];
		if(canSeeFullList {
			combinedClassInfo = await this.findCombinedClassListForSchool(schoolId);
		} else {
			combinedClassInfo = await this.findCombinedClassListForUser(schoolId);
		}

		combinedClassInfo.sort((a: ClassInfoDto, b: ClassInfoDto): number =>
			SortHelper.genericSortFunction(a[sortBy], b[sortBy], sortOrder)
		);

		const pageContent: ClassInfoDto[] = this.applyPagination(combinedClassInfo, skip, limit);

		const page: Page<ClassInfoDto> = new Page<ClassInfoDto>(pageContent, combinedClassInfo.length);

		return page;
	}

	private async findCombinedClassListForSchool(schoolId: EntityId): Promise<ClassInfoDto[]> {
		const [classInfosFromClasses, classInfosFromGroups] = await Promise.all([
			await this.findClassesForSchool(schoolId),
			await this.findGroupsOfTypeClassForSchool(schoolId),
		]);

		const combinedClassInfo: ClassInfoDto[] = [...classInfosFromClasses, ...classInfosFromGroups];

		return combinedClassInfo;
	}

	private async findCombinedClassListForUser(userId: EntityId): Promise<ClassInfoDto[]> {
		const [classInfosFromClasses, classInfosFromGroups] = await Promise.all([
			await this.findClassesForUser(userId),
			await this.findGroupsOfTypeClassForUser(userId),
		]);

		const combinedClassInfo: ClassInfoDto[] = [...classInfosFromClasses, ...classInfosFromGroups];

		return combinedClassInfo;
	}

	private async findClassesForSchool(schoolId: EntityId): Promise<ClassInfoDto[]> {
		const classes: Class[] = await this.classService.findClassesForSchool(schoolId);

		const classInfosFromClasses: ClassInfoDto[] = await Promise.all(
			classes.map(this.getClassInfoFromClass)
		);

		return classInfosFromClasses;
	}

	private async findClassesForUser(userId: EntityId): Promise<ClassInfoDto[]> {
		const classes: Class[] = await this.classService.findClassesForUser(userId);

		const classInfosFromClasses: ClassInfoDto[] = await Promise.all(
			classes.map(this.getClassInfoFromClass)
		);

		return classInfosFromClasses;
	}

	private async getClassInfoFromClass(clazz: Class): Promise<ClassInfoDto> {
		const teachers: UserDO[] = await Promise.all(
			clazz.teacherIds.map((teacherId: EntityId) => this.userService.findById(teacherId))
		);

		let schoolYear: SchoolYearEntity | undefined;
		if (clazz.year) {
			schoolYear = await this.schoolYearService.findById(clazz.year);
		}

		const mapped: ClassInfoDto = GroupUcMapper.mapClassToClassInfoDto(clazz, teachers, schoolYear);

		return mapped;
	}

	private async findGroupsOfTypeClassForSchool(schoolId: EntityId): Promise<ClassInfoDto[]> {
		const groupsOfTypeClass: Group[] = await this.groupService.findClassesForSchool(schoolId);

		const systemMap: Map<EntityId, SystemDto> = await this.findSystemNamesForGroups(groupsOfTypeClass);

		const classInfosFromGroups: ClassInfoDto[] = await Promise.all(
			groupsOfTypeClass.map(async (group: Group): Promise<ClassInfoDto> => this.getClassInfoFromGroup(group, systemMap))
		);

		return classInfosFromGroups;
	}

	private async findGroupsOfTypeClassForUser(userId: EntityId): Promise<ClassInfoDto[]> {
		const user: UserDO = await this.userService.findById(userId);

		const groupsOfTypeClass: Group[] = await this.groupService.findByUser(user);

		const systemMap: Map<EntityId, SystemDto> = await this.findSystemNamesForGroups(groupsOfTypeClass);

		const classInfosFromGroups: ClassInfoDto[] = await Promise.all(
			groupsOfTypeClass.map(async (group: Group): Promise<ClassInfoDto> => this.getClassInfoFromGroup(group, systemMap))
		);

		return classInfosFromGroups;
	}

	private async getClassInfoFromGroup(group: Group, systemMap: Map<EntityId, SystemDto>): Promise<ClassInfoDto> {
		let system: SystemDto | undefined;
		if (group.externalSource) {
			system = systemMap.get(group.externalSource.systemId);
		}

		const resolvedUsers: ResolvedGroupUser[] = await this.findUsersForGroup(group);

		const mapped: ClassInfoDto = GroupUcMapper.mapGroupToClassInfoDto(group, resolvedUsers, system);

		return mapped;
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

	private applyPagination(combinedClassInfo: ClassInfoDto[], skip: number, limit: number | undefined) {
		const page: ClassInfoDto[] = combinedClassInfo.slice(skip, limit ? skip + limit : combinedClassInfo.length);

		return page;
	}

	public async getGroup(userId: EntityId, groupId: EntityId): Promise<ResolvedGroupDto> {
		const group: Group = await this.groupService.findById(groupId);

		await this.checkPermission(userId, group);

		const resolvedUsers: ResolvedGroupUser[] = await this.findUsersForGroup(group);
		const resolvedGroup: ResolvedGroupDto = GroupUcMapper.mapToResolvedGroupDto(group, resolvedUsers);

		return resolvedGroup;
	}

	private async checkPermission(userId: EntityId, group: Group): Promise<void> {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		return this.authorizationService.checkPermission(
			user,
			group,
			AuthorizationContextBuilder.read([Permission.GROUP_VIEW])
		);
	}
}
