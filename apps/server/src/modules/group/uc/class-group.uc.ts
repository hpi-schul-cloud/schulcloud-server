import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { ClassService } from '@modules/class';
import { Class } from '@modules/class/domain';
import { ClassScope } from '@modules/class/repo';
import { Course, CourseDoService } from '@modules/course';
import { RoleDto, RoleName, RoleService } from '@modules/role';
import { School, SchoolService, SchoolYear, SchoolYearService } from '@modules/school/domain';
import { System, SystemService } from '@modules/system';
import { UserService } from '@modules/user';
import { User } from '@modules/user/repo';
import { Inject, Injectable } from '@nestjs/common';
import { SortHelper } from '@shared/common/utils';
import { Page } from '@shared/domain/domainobject';
import { Pagination, Permission, SortOrder } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { GroupConfig } from '..';
import { ClassSortQueryType, SchoolYearQueryType } from '../controller/dto/interface';
import { Group, GroupAggregateScope, GroupTypes, GroupUser, GroupVisibilityPermission } from '../domain';
import { GROUP_CONFIG_TOKEN } from '../group.config';
import { UnknownQueryTypeLoggableException } from '../loggable';
import { GroupService } from '../service';
import { ClassInfoDto, ClassRootType, InternalClassDto } from './dto';

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
		@Inject(GROUP_CONFIG_TOKEN)
		private readonly config: GroupConfig,
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

		const groupVisibilityPermission: GroupVisibilityPermission = this.getGroupVisibilityPermission(user);
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

				if (this.config.featureSchulconnexCourseSyncEnabled && dto.isGroup()) {
					synchronizedCourses = await this.courseService.findBySyncedGroup(dto.original);
				}

				return new ClassInfoDto({
					...dto,
					synchronizedCourses,
				});
			}
		);

		const classInfoDtos: ClassInfoDto[] = await Promise.all(classInfoDtoPromises);

		const finalPage: Page<ClassInfoDto> = new Page(classInfoDtos, classDtoPage.total);

		return finalPage;
	}

	private getGroupVisibilityPermission(user: User): GroupVisibilityPermission {
		const canSeeAllSchoolGroups = this.authorizationService.hasAllPermissions(user, [
			Permission.CLASS_FULL_ADMIN,
			Permission.GROUP_FULL_ADMIN,
		]);

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
		const teacherIds = groups.data.flatMap((group: Group) =>
			group.users
				.filter((groupUser: GroupUser) => groupUser.roleId === teacherRole.id)
				.map((groupUser: GroupUser) => groupUser.userId)
		);
		const uniqueTeacherIds = Array.from(new Set(teacherIds));
		const teachers = (await this.userService.findByIds(uniqueTeacherIds)) ?? [];

		const groupDtos: InternalClassDto<Group>[] = groups.data.map((group: Group): InternalClassDto<Group> => {
			const studentCount: number = group.users.reduce(
				(acc: number, element: GroupUser): number => (element.roleId === studentRole.id ? acc + 1 : acc),
				0
			);
			const externalSourceName: string | undefined = group.externalSource
				? systems.find((system: System): boolean => system.id === group.externalSource?.systemId)?.displayName
				: undefined;

			const teacherNames: string[] = teachers
				.filter((teacher) => group.users.map((user) => user.userId).includes(teacher.id ?? 'no-id-defined'))
				.map((teacher) => `${teacher.firstName} ${teacher.lastName}`);

			const mapped: InternalClassDto<Group> = new InternalClassDto({
				id: group.id,
				type: ClassRootType.GROUP,
				name: group.name,
				externalSourceName,
				teacherNames,
				studentCount,
				original: group,
			});

			return mapped;
		});

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

		const teacherIds = classes.flatMap((clazz: Class) => clazz.teacherIds || []);
		const uniqueTeacherIds = Array.from(new Set(teacherIds));
		const teachers = (await this.userService.findByIds(uniqueTeacherIds)) ?? [];

		const classDtos: InternalClassDto<Class>[] = classes
			.map((clazz: Class): InternalClassDto<Class> | null => {
				const name: string = clazz.gradeLevel ? `${clazz.gradeLevel}${clazz.name}` : clazz.name;
				const isUpgradable: boolean = clazz.gradeLevel !== 13 && !clazz.successor;
				const schoolYear: SchoolYear | undefined = clazz.year
					? schoolYears.find((year: SchoolYear): boolean => year.id === clazz.year)
					: undefined;

				if (!this.isClassOfQueryType(currentYear, schoolYear, schoolYearQueryType)) {
					return null;
				}

				const teacherNames = teachers
					.filter((teacher) => clazz.teacherIds.includes(teacher.id ?? 'no-id-defined'))
					.map((teacher) => `${teacher.firstName} ${teacher.lastName}`);

				const mapped: InternalClassDto<Class> = new InternalClassDto({
					id: clazz.id,
					type: ClassRootType.CLASS,
					name,
					externalSourceName: clazz.source,
					teacherNames,
					schoolYear: schoolYear?.name,
					isUpgradable,
					studentCount: clazz.userIds.length,
					original: clazz,
				});

				return mapped;
			})
			.filter((clazz: InternalClassDto<Class> | null): clazz is InternalClassDto<Class> => !!clazz);

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
}
