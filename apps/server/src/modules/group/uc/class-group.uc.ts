import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { ClassService } from '@modules/class';
import { Class } from '@modules/class/domain';
import { CourseDoService } from '@modules/learnroom';
import { Course } from '@modules/learnroom/domain';
import { SchoolYearService } from '@modules/legacy-school';
import { ProvisioningConfig } from '@modules/provisioning';
import { School, SchoolService, SchoolYear } from '@modules/school/domain';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SortHelper } from '@shared/common';
import { Page, UserDO } from '@shared/domain/domainobject';
import { SchoolYearEntity, User } from '@shared/domain/entity';
import { Pagination, Permission, SortOrder } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { System, SystemService } from '@src/modules/system';
import { ClassRequestContext, SchoolYearQueryType } from '../controller/dto/interface';
import { Group, GroupFilter, GroupTypes } from '../domain';
import { UnknownQueryTypeLoggableException } from '../loggable';
import { GroupService } from '../service';
import { ClassInfoDto, ResolvedGroupUser } from './dto';
import { GroupUcMapper } from './mapper/group-uc.mapper';

@Injectable()
export class ClassGroupUc {
	constructor(
		private readonly groupService: GroupService,
		private readonly classService: ClassService,
		private readonly systemService: SystemService,
		private readonly schoolService: SchoolService,
		private readonly authorizationService: AuthorizationService,
		private readonly schoolYearService: SchoolYearService,
		private readonly courseService: CourseDoService,
		private readonly configService: ConfigService<ProvisioningConfig, true>
	) {}

	public async findAllClasses(
		userId: EntityId,
		schoolId: EntityId,
		schoolYearQueryType?: SchoolYearQueryType,
		calledFrom?: ClassRequestContext,
		pagination?: Pagination,
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
			combinedClassInfo = await this.findCombinedClassListForSchool(schoolId, schoolYearQueryType);
		} else {
			combinedClassInfo = await this.findCombinedClassListForUser(userId, schoolYearQueryType);
		}

		combinedClassInfo.sort((a: ClassInfoDto, b: ClassInfoDto): number =>
			SortHelper.genericSortFunction(a[sortBy], b[sortBy], sortOrder)
		);

		const pageContent: ClassInfoDto[] = this.applyPagination(combinedClassInfo, pagination?.skip, pagination?.limit);

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
			classInfosFromGroups = await this.findGroupsForSchool(schoolId);
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
		const currentYear: SchoolYear | undefined =
			classes.length > 0 ? await this.schoolService.getCurrentYear(classes[0].schoolId) : undefined;

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
		currentYear: SchoolYear | undefined,
		schoolYear?: SchoolYearEntity,
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

	private async findGroupsForSchool(schoolId: EntityId): Promise<ClassInfoDto[]> {
		const filter: GroupFilter = { schoolId, groupTypes: [GroupTypes.CLASS] };

		const groups: Page<Group> = await this.groupService.findGroups(filter);

		const classInfosFromGroups: ClassInfoDto[] = await this.getClassInfosFromGroups(groups.data);

		return classInfosFromGroups;
	}

	private async findGroupsForUser(userId: EntityId): Promise<ClassInfoDto[]> {
		const filter: GroupFilter = { userId, groupTypes: [GroupTypes.CLASS] };

		const groups: Page<Group> = await this.groupService.findGroups(filter);

		const classInfosFromGroups: ClassInfoDto[] = await this.getClassInfosFromGroups(groups.data);

		return classInfosFromGroups;
	}

	private async getClassInfosFromGroups(groups: Group[]): Promise<ClassInfoDto[]> {
		const systemMap: Map<EntityId, System> = await this.findSystemNamesForGroups(groups);

		const classInfosFromGroups: ClassInfoDto[] = await Promise.all(
			groups.map(async (group: Group): Promise<ClassInfoDto> => this.getClassInfoFromGroup(group, systemMap))
		);

		return classInfosFromGroups;
	}

	private async getClassInfoFromGroup(group: Group, systemMap: Map<EntityId, System>): Promise<ClassInfoDto> {
		let system: System | undefined;
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

	private async findSystemNamesForGroups(groups: Group[]): Promise<Map<EntityId, System>> {
		const systemIds: EntityId[] = groups
			.map((group: Group): string | undefined => group.externalSource?.systemId)
			.filter((systemId: string | undefined): systemId is EntityId => systemId !== undefined);

		const uniqueSystemIds: EntityId[] = Array.from(new Set(systemIds));

		const systems: Map<EntityId, System> = new Map<EntityId, System>();

		await Promise.all(
			uniqueSystemIds.map(async (systemId: string): Promise<void> => {
				const system: System | null = await this.systemService.findById(systemId);

				if (system) {
					systems.set(systemId, system);
				}
			})
		);

		return systems;
	}

	private applyPagination(combinedClassInfo: ClassInfoDto[], skip = 0, limit?: number): ClassInfoDto[] {
		let page: ClassInfoDto[];

		if (limit === -1) {
			page = combinedClassInfo.slice(skip);
		} else {
			page = combinedClassInfo.slice(skip, limit ? skip + limit : combinedClassInfo.length);
		}

		return page;
	}
}
