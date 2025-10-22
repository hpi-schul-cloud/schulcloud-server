import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { ClassService } from '@modules/class';
import { Class } from '@modules/class/domain';
import { ClassScope } from '@modules/class/repo';
import { Course, CourseDoService } from '@modules/course';
import { ProvisioningConfig } from '@modules/provisioning';
import { RoleDto, RoleName, RoleService } from '@modules/role';
import { School, SchoolService, SchoolYear, SchoolYearService } from '@modules/school/domain';
import { System, SystemService } from '@modules/system';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SortHelper } from '@shared/common/utils';
import { Page } from '@shared/domain/domainobject';
import { Pagination, Permission, SortOrder } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { ClassSortQueryType, SchoolYearQueryType } from '../controller/dto/interface';
import { Group, GroupAggregateScope, GroupTypes, GroupUser, GroupVisibilityPermission } from '../domain';
import { UnknownQueryTypeLoggableException } from '../loggable';
import { GroupService } from '../service';
import { ClassInfoDto, ClassRootType, InternalClassDto } from './dto';
import { UserDo, UserService } from '@modules/user';

@Injectable()
export class ClassGroupUc {
	constructor(
		private readonly groupService: GroupService,
		private readonly classService: ClassService,
		private readonly roleService: RoleService,
		private readonly systemService: SystemService,
		private readonly schoolService: SchoolService,
		private readonly authorizationService: AuthorizationService,
		private readonly schoolYearService: SchoolYearService,
		private readonly courseService: CourseDoService,
		private readonly configService: ConfigService<ProvisioningConfig, true>,
		private readonly userService: UserService
	) {}

	public async findAllClasses(
		userId: EntityId,
		schoolId: EntityId,
		schoolYearQueryType?: SchoolYearQueryType,
		pagination?: Pagination,
		sortBy: ClassSortQueryType = ClassSortQueryType.NAME,
		sortOrder: SortOrder = SortOrder.asc
	): Promise<Page<ClassInfoDto>> {
		const school: School = await this.schoolService.getSchoolById(schoolId);

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(
			user,
			school,
			AuthorizationContextBuilder.read([Permission.CLASS_VIEW, Permission.GROUP_VIEW])
		);

		const groupVisibilityPermission: GroupVisibilityPermission = this.getGroupVisibilityPermission(user, school);

		const page: Page<InternalClassDto<Group | Class>> = await this.findCombinedClassListPage(
			user,
			school,
			groupVisibilityPermission,
			schoolYearQueryType,
			pagination,
			sortBy,
			sortOrder
		);

		const finalPage: Page<ClassInfoDto> = await this.buildClassInfoPage(page);

		return finalPage;
	}

	private async buildClassInfoPage(classDtoPage: Page<InternalClassDto<Group | Class>>): Promise<Page<ClassInfoDto>> {
		const classInfoDtoPromises: Promise<ClassInfoDto>[] = classDtoPage.data.map(
			async (dto: InternalClassDto<Group | Class>): Promise<ClassInfoDto> => {
				let synchronizedCourses: Course[] | undefined;
				const teacherNames: string[] = dto.teacherNames || [];

				if (this.configService.get('FEATURE_SCHULCONNEX_COURSE_SYNC_ENABLED') && dto.isGroup()) {
					synchronizedCourses = await this.courseService.findBySyncedGroup(dto.original);
				}

				return new ClassInfoDto({
					...dto,
					teacherNames,
					synchronizedCourses,
				});
			}
		);

		const classInfoDtos: ClassInfoDto[] = await Promise.all(classInfoDtoPromises);

		const finalPage: Page<ClassInfoDto> = new Page(classInfoDtos, classDtoPage.total);

		return finalPage;
	}

	private getGroupVisibilityPermission(user: User, school: School): GroupVisibilityPermission {
		const canSeeAllSchoolGroups =
			this.authorizationService.hasAllPermissions(user, [Permission.CLASS_FULL_ADMIN, Permission.GROUP_FULL_ADMIN]) ||
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

	private async findCombinedClassListPage(
		user: User,
		school: School,
		groupVisibilityPermission: GroupVisibilityPermission,
		schoolYearQueryType?: SchoolYearQueryType,
		pagination?: Pagination,
		sortBy: ClassSortQueryType = ClassSortQueryType.NAME,
		sortOrder: SortOrder = SortOrder.asc
	): Promise<Page<InternalClassDto<Group | Class>>> {
		const schoolYears: SchoolYear[] = await this.schoolYearService.getAllSchoolYears();
		const { currentYear } = school;

		const classDtos: InternalClassDto<Class>[] = await this.getClassDtos(
			school,
			groupVisibilityPermission,
			user,
			schoolYears,
			currentYear,
			schoolYearQueryType
		);

		let groupDtos: InternalClassDto<Group>[] = [];
		if (!schoolYearQueryType || schoolYearQueryType === SchoolYearQueryType.CURRENT_YEAR) {
			groupDtos = await this.getGroupDtos(user, school, groupVisibilityPermission);
		}

		const combinedClassDtos: InternalClassDto<Class | Group>[] = [...classDtos, ...groupDtos];

		combinedClassDtos.sort((a: InternalClassDto<unknown>, b: InternalClassDto<unknown>): number =>
			SortHelper.genericSortFunction(a[sortBy], b[sortBy], sortOrder)
		);

		const pageContent: InternalClassDto<Class | Group>[] = this.applyPagination(
			combinedClassDtos,
			pagination?.skip,
			pagination?.limit
		);

		const page: Page<InternalClassDto<Class | Group>> = new Page(pageContent, combinedClassDtos.length);

		return page;
	}

	private async getGroupDtos(
		user: User,
		school: School,
		groupVisibilityPermission: GroupVisibilityPermission
	): Promise<InternalClassDto<Group>[]> {
		const scope = new GroupAggregateScope()
			.byOrganization(school.id)
			.byType([GroupTypes.CLASS, GroupTypes.COURSE, GroupTypes.OTHER]);

		if (groupVisibilityPermission === GroupVisibilityPermission.OWN_GROUPS) {
			scope.byUser(user.id);
		}

		const groups: Page<Group> = await this.groupService.findByScope(scope);

		const systemIdSet: Set<string> = new Set();
		groups.data.forEach((group: Group): void => {
			if (group.externalSource) {
				systemIdSet.add(group.externalSource.systemId);
			}
		});
		const systems: System[] = await this.systemService.getSystems(Array.from(systemIdSet));

		const studentRole: RoleDto = await this.roleService.findByName(RoleName.STUDENT);
		const teacherRole: RoleDto = await this.roleService.findByName(RoleName.TEACHER);
		const groupSubstitutionTeacherRole: RoleDto = await this.roleService.findByName(RoleName.GROUPSUBSTITUTIONTEACHER);

		const groupDtoPromises: Promise<InternalClassDto<Group>>[] = groups.data.map(
			async (group: Group): Promise<InternalClassDto<Group>> => {
				const studentCount: number = group.users.reduce(
					(acc: number, element: GroupUser): number => (element.roleId === studentRole.id ? acc + 1 : acc),
					0
				);
				const externalSourceName: string | undefined = group.externalSource
					? systems.find((system: System): boolean => system.id === group.externalSource?.systemId)?.displayName
					: undefined;
				const teachers: GroupUser[] = group.users.filter(
					(element: GroupUser): boolean =>
						element.roleId === teacherRole.id || element.roleId === groupSubstitutionTeacherRole.id
				);
				const teacherIds: EntityId[] = teachers.map((teacher) => teacher.userId);
				const teacherNames: string[] = await this.getLastNamesOfTeachers(teacherIds);

				const mapped: InternalClassDto<Group> = new InternalClassDto({
					id: group.id,
					type: ClassRootType.GROUP,
					name: group.name,
					externalSourceName,
					studentCount,
					teacherNames,
					original: group,
				});

				return mapped;
			}
		);

		const groupDtos: InternalClassDto<Group>[] = await Promise.all(groupDtoPromises);

		return groupDtos;
	}

	private async getClassDtos(
		school: School,
		groupVisibilityPermission: GroupVisibilityPermission,
		user: User,
		schoolYears: SchoolYear[],
		currentYear: SchoolYear | undefined,
		schoolYearQueryType: SchoolYearQueryType | undefined
	): Promise<InternalClassDto<Class>[]> {
		const classScope = new ClassScope().bySchoolId(school.id);

		if (groupVisibilityPermission === GroupVisibilityPermission.OWN_GROUPS) {
			classScope.byUserId(user.id);
		}

		const classes: Class[] = await this.classService.find(classScope);

		const classDtoResults: (InternalClassDto<Class> | null)[] = await Promise.all(
			classes.map(async (clazz: Class): Promise<InternalClassDto<Class> | null> => {
				const name: string = clazz.gradeLevel ? `${clazz.gradeLevel}${clazz.name}` : clazz.name;
				const isUpgradable: boolean = clazz.gradeLevel !== 13 && !clazz.successor;
				const schoolYear: SchoolYear | undefined = clazz.year
					? schoolYears.find((year: SchoolYear): boolean => year.id === clazz.year)
					: undefined;

				if (!this.isClassOfQueryType(currentYear, schoolYear, schoolYearQueryType)) {
					return null;
				}

				const teacherNames: string[] = await this.getLastNamesOfTeachers(clazz.teacherIds);

				const mapped: InternalClassDto<Class> = new InternalClassDto({
					id: clazz.id,
					type: ClassRootType.CLASS,
					name,
					externalSourceName: clazz.source,
					schoolYear: schoolYear?.name,
					isUpgradable,
					studentCount: clazz.userIds.length,
					teacherNames,
					original: clazz,
				});

				return mapped;
			})
		);
		const classDtos: InternalClassDto<Class>[] = classDtoResults.filter(
			(clazz): clazz is InternalClassDto<Class> => !!clazz
		);

		return classDtos;
	}

	private isClassOfQueryType(
		currentYear?: SchoolYear,
		schoolYear?: SchoolYear,
		schoolYearQueryType?: SchoolYearQueryType
	): boolean {
		if (schoolYearQueryType === undefined) {
			return true;
		}

		if (schoolYear === undefined || currentYear === undefined) {
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

	private applyPagination<T>(array: T[], skip = 0, limit?: number): T[] {
		const positiveSkip: number = Math.max(0, skip);

		const page: T[] = array.slice(positiveSkip, limit && limit >= 0 ? positiveSkip + limit : undefined);

		return page;
	}

	private async getLastNamesOfTeachers(userIds: EntityId[]): Promise<string[]> {
		const users = await Promise.all(userIds.map((userId) => this.userService.findByIdOrNull(userId)));
		const lastNames = users.filter((user): user is UserDo => !!user).map((user) => user?.lastName);
		return lastNames;
	}
}
