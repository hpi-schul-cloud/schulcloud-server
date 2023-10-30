import { Injectable } from '@nestjs/common';
import { LegacySchoolDo } from '@shared/domain/domainobject/legacy-school.do';
import { Page } from '@shared/domain/domainobject/page';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { SchoolYearEntity } from '@shared/domain/entity/schoolyear.entity';
import { User } from '@shared/domain/entity/user.entity';
import { SortOrder } from '@shared/domain/interface/find-options';
import { Permission } from '@shared/domain/interface/permission.enum';
import { EntityId } from '@shared/domain/types/entity-id';
import { AuthorizationContextBuilder } from '@src/modules/authorization/authorization-context.builder';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';
import { Class } from '@src/modules/class/domain/class.do';
import { ClassService } from '@src/modules/class/service/class.service';
import { LegacySchoolService } from '@src/modules/legacy-school/service/legacy-school.service';
import { SchoolYearService } from '@src/modules/legacy-school/service/school-year.service';
import { RoleDto } from '@src/modules/role/service/dto/role.dto';
import { RoleService } from '@src/modules/role/service/role.service';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { SystemService } from '@src/modules/system/service/system.service';
import { UserService } from '@src/modules/user/service/user.service';
import { Group } from '../domain/group';
import { GroupUser } from '../domain/group-user';
import { GroupService } from '../service/group.service';
import { SortHelper } from '../util/sort-helper';
import { ClassInfoDto } from './dto/class-info.dto';
import { ResolvedGroupUser } from './dto/resolved-group-user';
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
		this.authorizationService.checkPermission(user, school, AuthorizationContextBuilder.read([Permission.CLASS_LIST]));

		const combinedClassInfo: ClassInfoDto[] = await this.findCombinedClassListForSchool(schoolId);

		combinedClassInfo.sort((a: ClassInfoDto, b: ClassInfoDto): number =>
			SortHelper.genericSortFunction(a[sortBy], b[sortBy], sortOrder)
		);

		const pageContent: ClassInfoDto[] = this.applyPagination(combinedClassInfo, skip, limit);

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

				let schoolYear: SchoolYearEntity | undefined;
				if (clazz.year) {
					schoolYear = await this.schoolYearService.findById(clazz.year);
				}

				const mapped: ClassInfoDto = GroupUcMapper.mapClassToClassInfoDto(clazz, teachers, schoolYear);

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

	private applyPagination(combinedClassInfo: ClassInfoDto[], skip: number, limit: number | undefined) {
		const page: ClassInfoDto[] = combinedClassInfo.slice(skip, limit ? skip + limit : combinedClassInfo.length);

		return page;
	}
}
