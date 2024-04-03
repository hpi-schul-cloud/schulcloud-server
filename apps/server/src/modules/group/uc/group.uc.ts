import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { ClassService } from '@modules/class';
import { Class } from '@modules/class/domain';
import { Course } from '@modules/learnroom/domain';
import { CourseDoService } from '@modules/learnroom/service/course-do.service';
import { SchoolYearService } from '@modules/legacy-school';
import { ProvisioningConfig } from '@modules/provisioning';
import { RoleService } from '@modules/role';
import { RoleDto } from '@modules/role/service/dto/role.dto';
import { School, SchoolService } from '@modules/school/domain';
import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SortHelper } from '@shared/common';
import { Page, UserDO } from '@shared/domain/domainobject';
import { SchoolYearEntity, User } from '@shared/domain/entity';
import { Permission, SortOrder } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import { LegacySystemService, SystemDto } from '@src/modules/system';
import { ClassRequestContext, SchoolYearQueryType } from '../controller/dto/interface';
import { Group, GroupTypes, GroupUser } from '../domain';
import { UnknownQueryTypeLoggableException } from '../loggable';
import { GroupService } from '../service';
import { ClassInfoDto, ResolvedGroupDto, ResolvedGroupUser } from './dto';
import { GroupUcMapper } from './mapper/group-uc.mapper';

@Injectable()
export class GroupUc {
	constructor(
		private readonly groupService: GroupService,
		private readonly classService: ClassService,
		private readonly systemService: LegacySystemService,
		private readonly userService: UserService,
		private readonly roleService: RoleService,
		private readonly schoolService: SchoolService,
		private readonly authorizationService: AuthorizationService,
		private readonly schoolYearService: SchoolYearService,
		private readonly courseService: CourseDoService,
		private readonly configService: ConfigService<ProvisioningConfig, true>,
		private readonly logger: Logger
	) {}

	private ALLOWED_GROUP_TYPES: GroupTypes[] = [GroupTypes.CLASS, GroupTypes.COURSE, GroupTypes.OTHER];

	public async findAllClasses(
		userId: EntityId,
		schoolId: EntityId,
		schoolYearQueryType?: SchoolYearQueryType,
		calledFrom?: ClassRequestContext,
		skip = 0,
		limit?: number,
		sortBy: keyof ClassInfoDto = 'name',
		sortOrder: SortOrder = SortOrder.asc
	): Promise<Page<ClassInfoDto>> {
		const school: School = await this.schoolService.getSchoolById(schoolId);

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

		const calledFromCourse: boolean =
			calledFrom === ClassRequestContext.COURSE && school.getPermissions()?.teacher?.STUDENT_LIST === true;

		let combinedClassInfo: ClassInfoDto[];
		if (canSeeFullList || calledFromCourse) {
			combinedClassInfo = await this.findCombinedClassListForSchool(school, schoolYearQueryType);
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
		school: School,
		schoolYearQueryType?: SchoolYearQueryType
	): Promise<ClassInfoDto[]> {
		let classInfosFromGroups: ClassInfoDto[] = [];

		const classInfosFromClasses = await this.findClassesForSchool(school.id, schoolYearQueryType);

		if (!schoolYearQueryType || schoolYearQueryType === SchoolYearQueryType.CURRENT_YEAR) {
			classInfosFromGroups = await this.findGroupsForSchool(school);
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
			classInfosFromGroups = await this.findGroupsForUser(userId);
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

		const classInfosFromClasses: ClassInfoDto[] = this.mapClassInfosFromClasses(filteredClassesForSchoolYear);

		return classInfosFromClasses;
	}

	private async addSchoolYearsToClasses(classes: Class[]): Promise<{ clazz: Class; schoolYear?: SchoolYearEntity }[]> {
		const classesWithSchoolYear: { clazz: Class; schoolYear?: SchoolYearEntity }[] = await Promise.all(
			classes.map(async (clazz: Class) => {
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

	private mapClassInfosFromClasses(
		filteredClassesForSchoolYear: { clazz: Class; schoolYear?: SchoolYearEntity }[]
	): ClassInfoDto[] {
		const classInfosFromClasses: ClassInfoDto[] = filteredClassesForSchoolYear.map(
			(classWithSchoolYear): ClassInfoDto => {
				const teachers: UserDO[] = [];

				const mapped: ClassInfoDto = GroupUcMapper.mapClassToClassInfoDto(
					classWithSchoolYear.clazz,
					teachers,
					classWithSchoolYear.schoolYear
				);

				return mapped;
			}
		);
		return classInfosFromClasses;
	}

	private async findGroupsForSchool(school: School): Promise<ClassInfoDto[]> {
		const groups: Page<Group> = await this.groupService.findGroupsBySchoolIdAndGroupTypes(
			school,
			this.ALLOWED_GROUP_TYPES
		);

		const classInfosFromGroups: ClassInfoDto[] = await this.getClassInfosFromGroups(groups.data);

		return classInfosFromGroups;
	}

	private async findGroupsForUser(userId: EntityId): Promise<ClassInfoDto[]> {
		const user: UserDO = await this.userService.findById(userId);

		const groups: Page<Group> = await this.groupService.findGroupsByUserAndGroupTypes(
			user,
			this.ALLOWED_GROUP_TYPES,
			0
		);

		const classInfosFromGroups: ClassInfoDto[] = await this.getClassInfosFromGroups(groups.data);

		return classInfosFromGroups;
	}

	private async getClassInfosFromGroups(groups: Group[]): Promise<ClassInfoDto[]> {
		const systemMap: Map<EntityId, SystemDto> = await this.findSystemNamesForGroups(groups);

		const classInfosFromGroups: ClassInfoDto[] = await Promise.all(
			groups.map(async (group: Group): Promise<ClassInfoDto> => this.getClassInfoFromGroup(group, systemMap))
		);

		return classInfosFromGroups;
	}

	private async getClassInfoFromGroup(group: Group, systemMap: Map<EntityId, SystemDto>): Promise<ClassInfoDto> {
		let system: SystemDto | undefined;
		if (group.externalSource) {
			system = systemMap.get(group.externalSource.systemId);
		}

		const resolvedUsers: ResolvedGroupUser[] = [];

		let synchronizedCourses: Course[] = [];
		if (this.configService.get('FEATURE_SCHULCONNEX_COURSE_SYNC_ENABLED')) {
			synchronizedCourses = await this.courseService.findBySyncedGroup(group);
		}

		const mapped: ClassInfoDto = GroupUcMapper.mapGroupToClassInfoDto(
			group,
			resolvedUsers,
			synchronizedCourses,
			system
		);

		return mapped;
	}

	private async findSystemNamesForGroups(groups: Group[]): Promise<Map<EntityId, SystemDto>> {
		const systemIds: EntityId[] = groups
			.map((group: Group): string | undefined => group.externalSource?.systemId)
			.filter((systemId: string | undefined): systemId is EntityId => systemId !== undefined);

		const uniqueSystemIds: EntityId[] = Array.from(new Set(systemIds));

		const systems: Map<EntityId, SystemDto> = new Map<EntityId, SystemDto>();

		await Promise.all(
			uniqueSystemIds.map(async (systemId: string): Promise<void> => {
				const system: SystemDto = await this.systemService.findById(systemId);

				systems.set(systemId, system);
			})
		);

		return systems;
	}

	private async findUsersForGroup(group: Group): Promise<ResolvedGroupUser[]> {
		const resolvedGroupUsersOrNull: (ResolvedGroupUser | null)[] = await Promise.all(
			group.users.map(async (groupUser: GroupUser): Promise<ResolvedGroupUser | null> => {
				const user: UserDO | null = await this.userService.findByIdOrNull(groupUser.userId);
				let resolvedGroup: ResolvedGroupUser | null = null;

				/* TODO add this log back later
					    this.logger.warning(
						new ReferencedEntityNotFoundLoggable(Group.name, group.id, UserDO.name, groupUser.userId)
					); */
				if (user) {
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

	private applyPagination(combinedClassInfo: ClassInfoDto[], skip: number, limit: number | undefined): ClassInfoDto[] {
		let page: ClassInfoDto[];

		if (limit === -1) {
			page = combinedClassInfo.slice(skip);
		} else {
			page = combinedClassInfo.slice(skip, limit ? skip + limit : combinedClassInfo.length);
		}

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

	public async getAllGroups(
		userId: EntityId,
		schoolId: EntityId,
		skip?: number,
		limit?: number,
		availableGroupsForCourseSync?: boolean,
		nameQuery?: string
	): Promise<Page<ResolvedGroupDto>> {
		const school: School = await this.schoolService.getSchoolById(schoolId);

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(user, school, AuthorizationContextBuilder.read([Permission.GROUP_VIEW]));

		const canSeeFullList: boolean = this.authorizationService.hasAllPermissions(user, [Permission.GROUP_FULL_ADMIN]);

		let groups: Page<Group>;
		if (canSeeFullList) {
			groups = await this.getGroupsForSchool(school, skip, limit, availableGroupsForCourseSync, nameQuery);
		} else {
			groups = await this.getGroupsForUser(userId, skip, limit, availableGroupsForCourseSync, nameQuery);
		}

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

	private async getGroupsForSchool(
		school: School,
		skip?: number,
		limit?: number,
		availableGroupsForCourseSync?: boolean,
		nameQuery?: string
	): Promise<Page<Group>> {
		let foundGroups: Page<Group>;
		if (availableGroupsForCourseSync && this.configService.get('FEATURE_SCHULCONNEX_COURSE_SYNC_ENABLED')) {
			foundGroups = await this.groupService.findAvailableGroupsBySchoolId(school, skip, limit, nameQuery);
		} else {
			foundGroups = await this.groupService.findGroupsBySchoolIdAndGroupTypes(
				school,
				undefined,
				skip,
				limit,
				nameQuery
			);
		}

		return foundGroups;
	}

	private async getGroupsForUser(
		userId: EntityId,
		skip?: number,
		limit?: number,
		availableGroupsForCourseSync?: boolean,
		nameQuery?: string
	): Promise<Page<Group>> {
		let foundGroups: Page<Group>;
		const user: UserDO = await this.userService.findById(userId);
		if (availableGroupsForCourseSync && this.configService.get('FEATURE_SCHULCONNEX_COURSE_SYNC_ENABLED')) {
			foundGroups = await this.groupService.findAvailableGroupsByUser(user, skip, limit, nameQuery);
		} else {
			foundGroups = await this.groupService.findGroupsByUserAndGroupTypes(
				user,
				this.ALLOWED_GROUP_TYPES,
				skip,
				limit,
				nameQuery
			);
		}

		return foundGroups;
	}
}
