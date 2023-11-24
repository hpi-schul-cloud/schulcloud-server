import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { ClassService } from '@modules/class';
import { Class } from '@modules/class/domain';
import { LegacySchoolService, SchoolYearService } from '@modules/legacy-school';
import { RoleService } from '@modules/role';
import { RoleDto } from '@modules/role/service/dto/role.dto';
import { SystemDto, SystemService } from '@modules/system';
import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { LegacySchoolDo, Page, UserDO } from '@shared/domain/domainobject';
import { SchoolYearEntity, User } from '@shared/domain/entity';
import { Permission, SortOrder } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { SchoolYearQueryType } from '../controller/dto/interface';
import { Group, GroupUser } from '../domain';
import { UnknownQueryTypeLoggableException } from '../loggable';
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

	public async findAllClasses(
		userId: EntityId,
		schoolId: EntityId,
		schoolYearQueryType?: SchoolYearQueryType,
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
			Permission.CLASS_FULL_ADMIN,
			Permission.GROUP_FULL_ADMIN,
		]);

		let combinedClassInfo: ClassInfoDto[];
		if (canSeeFullList) {
			combinedClassInfo = await this.findCombinedClassListForSchool(schoolId, schoolYearQueryType);
		} else {
			combinedClassInfo = await this.findCombinedClassListForUser(userId, schoolYearQueryType);
		}

		combinedClassInfo.sort((a: ClassInfoDto, b: ClassInfoDto): number =>
			SortHelper.genericSortFunction(a[sortBy], b[sortBy], sortOrder)
		);

		const pageContent: ClassInfoDto[] = this.applyPagination(combinedClassInfo, skip, limit);

		const page: Page<ClassInfoDto> = new Page<ClassInfoDto>(pageContent, combinedClassInfo.length);

		return page;
	}

	private async findCombinedClassListForSchool(
		schoolId: EntityId,
		schoolYearQueryType?: SchoolYearQueryType
	): Promise<ClassInfoDto[]> {
		let classInfosFromGroups: ClassInfoDto[] = [];

		const classInfosFromClasses = await this.findClassesForSchool(schoolId, schoolYearQueryType);

		if (!schoolYearQueryType || schoolYearQueryType === SchoolYearQueryType.CURRENT_YEAR) {
			classInfosFromGroups = await this.findGroupsOfTypeClassForSchool(schoolId);
		}

		const combinedClassInfo: ClassInfoDto[] = [...classInfosFromClasses, ...classInfosFromGroups];

		return combinedClassInfo;
	}

	private async findCombinedClassListForUser(
		userId: EntityId,
		schoolYearQueryType?: SchoolYearQueryType
	): Promise<ClassInfoDto[]> {
		let classInfosFromGroups: ClassInfoDto[] = [];

		const classInfosFromClasses = await this.findClassesForUser(userId, schoolYearQueryType);

		if (!schoolYearQueryType || schoolYearQueryType === SchoolYearQueryType.CURRENT_YEAR) {
			classInfosFromGroups = await this.findGroupsOfTypeClassForUser(userId);
		}

		const combinedClassInfo: ClassInfoDto[] = [...classInfosFromClasses, ...classInfosFromGroups];

		return combinedClassInfo;
	}

	private async findClassesForSchool(
		schoolId: EntityId,
		schoolYearQueryType?: SchoolYearQueryType
	): Promise<ClassInfoDto[]> {
		const classes: Class[] = await this.classService.findClassesForSchool(schoolId);

		const classInfosFromClasses: ClassInfoDto[] = await this.getClassInfosFromClasses(classes, schoolYearQueryType);

		return classInfosFromClasses;
	}

	private async findClassesForUser(
		userId: EntityId,
		schoolYearQueryType?: SchoolYearQueryType
	): Promise<ClassInfoDto[]> {
		const classes: Class[] = await this.classService.findAllByUserId(userId);

		const classInfosFromClasses: ClassInfoDto[] = await this.getClassInfosFromClasses(classes, schoolYearQueryType);

		return classInfosFromClasses;
	}

	private async getClassInfosFromClasses(
		classes: Class[],
		schoolYearQueryType?: SchoolYearQueryType
	): Promise<ClassInfoDto[]> {
		const currentYear: SchoolYearEntity = await this.schoolYearService.getCurrentSchoolYear();

		const classesWithSchoolYear: { clazz: Class; schoolYear?: SchoolYearEntity }[] = await this.addSchoolYearsToClasses(
			classes
		);

		const filteredClassesForSchoolYear = classesWithSchoolYear.filter((classWithSchoolYear) =>
			this.isClassOfQueryType(currentYear, classWithSchoolYear.schoolYear, schoolYearQueryType)
		);

		const classInfosFromClasses = await this.mapClassInfosFromClasses(filteredClassesForSchoolYear);

		return classInfosFromClasses;
	}

	private async addSchoolYearsToClasses(classes: Class[]): Promise<{ clazz: Class; schoolYear?: SchoolYearEntity }[]> {
		const classesWithSchoolYear: { clazz: Class; schoolYear?: SchoolYearEntity }[] = await Promise.all(
			classes.map(async (clazz) => {
				let schoolYear: SchoolYearEntity | undefined;
				if (clazz.year) {
					schoolYear = await this.schoolYearService.findById(clazz.year);
				}

				return {
					clazz,
					schoolYear,
				};
			})
		);
		return classesWithSchoolYear;
	}

	private isClassOfQueryType(
		currentYear: SchoolYearEntity,
		schoolYear?: SchoolYearEntity,
		schoolYearQueryType?: SchoolYearQueryType
	): boolean {
		if (schoolYearQueryType === undefined) {
			return true;
		}

		if (schoolYear === undefined) {
			return schoolYearQueryType === SchoolYearQueryType.CURRENT_YEAR;
		}

		switch (schoolYearQueryType) {
			case SchoolYearQueryType.CURRENT_YEAR:
				return schoolYear.startDate === currentYear.startDate;
			case SchoolYearQueryType.NEXT_YEAR:
				return schoolYear.startDate > currentYear.startDate;
			case SchoolYearQueryType.PREVIOUS_YEARS:
				return schoolYear.startDate < currentYear.startDate;
			default:
				throw new UnknownQueryTypeLoggableException(schoolYearQueryType);
		}
	}

	private async mapClassInfosFromClasses(
		filteredClassesForSchoolYear: { clazz: Class; schoolYear?: SchoolYearEntity }[]
	): Promise<ClassInfoDto[]> {
		const classInfosFromClasses = await Promise.all(
			filteredClassesForSchoolYear.map(async (classWithSchoolYear): Promise<ClassInfoDto> => {
				const teachers: UserDO[] = await Promise.all(
					classWithSchoolYear.clazz.teacherIds.map((teacherId: EntityId) => this.userService.findById(teacherId))
				);

				const mapped: ClassInfoDto = GroupUcMapper.mapClassToClassInfoDto(
					classWithSchoolYear.clazz,
					teachers,
					classWithSchoolYear.schoolYear
				);

				return mapped;
			})
		);
		return classInfosFromClasses;
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
