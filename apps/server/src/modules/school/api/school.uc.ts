import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { ClassService } from '@modules/class';
import { RoleName } from '@modules/role';
import { UserDo, UserService } from '@modules/user';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject';
import { Permission, SortOrder } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { School, SchoolQuery, SchoolService, SchoolYear, SchoolYearHelper, SchoolYearService } from '../domain';
import {
	SchoolAlreadyInMaintenanceLoggableException,
	SchoolAlreadyInNextYearLoggableException,
	SchoolInUserMigrationLoggableException,
	SchoolNotInMaintenanceLoggableException,
} from '../domain/loggable';
import {
	MaintenanceResponse,
	SchoolExistsResponse,
	SchoolForExternalInviteResponse,
	SchoolListResponse,
	SchoolForLdapLoginResponse,
	SchoolResponse,
	SchoolSystemResponse,
	SchoolUpdateBodyParams,
	SchoolUserListResponse,
} from './dto';
import {
	MaintenanceResponseMapper,
	SchoolResponseMapper,
	SchoolUserResponseMapper,
	SystemResponseMapper,
	YearsResponseMapper,
} from './mapper';
import { MoinSchuleClassService } from '@modules/class-moin-schule/moin-schule-class.service';
import { PaginationParams } from '@shared/controller/dto';

@Injectable()
export class SchoolUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly classService: ClassService,
		private readonly moinSchuleClassService: MoinSchuleClassService,
		private readonly schoolService: SchoolService,
		private readonly schoolYearService: SchoolYearService,
		private readonly userService: UserService
	) {}

	public async getSchoolById(schoolId: EntityId, userId: EntityId): Promise<SchoolResponse> {
		const [school, user, schoolYears] = await Promise.all([
			this.schoolService.getSchoolById(schoolId),
			this.authorizationService.getUserWithPermissions(userId),
			this.schoolYearService.getAllSchoolYears(),
		]);

		const authContext = AuthorizationContextBuilder.read([]);
		this.authorizationService.checkPermission(user, school, authContext);

		const responseDto = this.mapToSchoolResponseDto(school, schoolYears);

		return responseDto;
	}

	public async getSchoolSystems(schoolId: EntityId, userId: EntityId): Promise<SchoolSystemResponse[]> {
		const [school, user] = await Promise.all([
			this.schoolService.getSchoolById(schoolId),
			this.authorizationService.getUserWithPermissions(userId),
		]);

		const authContext = AuthorizationContextBuilder.read([Permission.SCHOOL_SYSTEM_VIEW]);
		this.authorizationService.checkPermission(user, school, authContext);

		const systems = await this.schoolService.getSchoolSystems(school);

		const responseDto = SystemResponseMapper.mapToSchoolSystemResponse(systems);

		return responseDto;
	}

	public async getSchoolList(
		paginationParams: PaginationParams,
		federalStateId?: EntityId
	): Promise<SchoolListResponse> {
		const findOptions = {
			order: {
				name: SortOrder.asc,
			},
			pagination: paginationParams,
		};

		const { schools, count } = await this.schoolService.getSchoolList(findOptions, federalStateId);
		const dtos = SchoolResponseMapper.mapToSchoolListResponse(
			schools,
			{
				skip: paginationParams.skip,
				limit: paginationParams.limit,
			},
			count
		);

		return dtos;
	}

	public async getSchoolListForExternalInvite(
		query: SchoolQuery,
		ownSchoolId: EntityId
	): Promise<SchoolForExternalInviteResponse[]> {
		const findOptions = {
			order: {
				name: SortOrder.asc,
			},
		};

		const schools = await this.schoolService.getSchoolsForExternalInvite(query, ownSchoolId, findOptions);

		const dtos = SchoolResponseMapper.mapToListForExternalInviteResponses(schools);

		return dtos;
	}

	public async doesSchoolExist(schoolId: EntityId): Promise<SchoolExistsResponse> {
		const result = await this.schoolService.doesSchoolExist(schoolId);

		const res = new SchoolExistsResponse({ exists: result });

		return res;
	}

	public async getSchoolListForLdapLogin(): Promise<SchoolForLdapLoginResponse[]> {
		const schools = await this.schoolService.getSchoolsForLdapLogin();

		const dtos = SchoolResponseMapper.mapToListForLdapLoginResponses(schools);

		return dtos;
	}

	public async updateSchool(userId: string, schoolId: string, body: SchoolUpdateBodyParams): Promise<SchoolResponse> {
		const [school, user, schoolYears] = await Promise.all([
			this.schoolService.getSchoolById(schoolId),
			this.authorizationService.getUserWithPermissions(userId),
			this.schoolYearService.getAllSchoolYears(),
		]);

		const authContext = AuthorizationContextBuilder.write([Permission.SCHOOL_EDIT]);
		this.authorizationService.checkPermission(user, school, authContext);

		const updatedSchool = await this.schoolService.updateSchool(school, body);

		const responseDto = this.mapToSchoolResponseDto(updatedSchool, schoolYears);

		return responseDto;
	}

	public async removeSystemFromSchool(schoolId: EntityId, systemId: EntityId, userId: EntityId): Promise<void> {
		const [user, school] = await Promise.all([
			this.authorizationService.getUserWithPermissions(userId),
			this.schoolService.getSchoolById(schoolId),
		]);

		this.authorizationService.checkPermission(
			user,
			school,
			AuthorizationContextBuilder.write([Permission.SCHOOL_EDIT, Permission.SCHOOL_SYSTEM_EDIT])
		);

		await this.schoolService.removeSystemFromSchool(school, systemId);
	}

	private mapToSchoolResponseDto(school: School, schoolYears: SchoolYear[]): SchoolResponse {
		const { activeYear, lastYear, nextYear } = SchoolYearHelper.computeActiveAndLastAndNextYear(school, schoolYears);
		const yearsResponse = YearsResponseMapper.mapToResponse(schoolYears, activeYear, lastYear, nextYear);

		const dto = SchoolResponseMapper.mapToResponse(school, yearsResponse);

		return dto;
	}

	public async getSchoolTeachers(schoolId: EntityId, userId: EntityId): Promise<SchoolUserListResponse> {
		const [user] = await Promise.all([
			this.authorizationService.getUserWithPermissions(userId),
			this.schoolService.getSchoolById(schoolId), // ensure school exists
		]);

		let result: Page<UserDo>;
		if (this.isUserOfSchool(user, schoolId)) {
			result = await this.userService.findBySchoolRole(schoolId, RoleName.TEACHER);
		} else {
			this.checkHasPermissionToAccessTeachers(user);
			result = await this.userService.findPublicTeachersBySchool(schoolId);
		}

		const responseDto = SchoolUserResponseMapper.mapToListResponse(result);
		return responseDto;
	}

	public async getSchoolStudents(schoolId: EntityId, userId: EntityId): Promise<SchoolUserListResponse> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const isUserOfSchool = this.isUserOfSchool(user, schoolId);

		let result: Page<UserDo>;
		if (isUserOfSchool) {
			result = await this.getAllStudentsOfSchool(schoolId);
		} else {
			result = await this.getAllStudentsFromUsersClasses(userId, schoolId);
		}

		const responseDto = SchoolUserResponseMapper.mapToListResponse(result);
		return responseDto;
	}

	private async getAllStudentsFromUsersClasses(userId: EntityId, schoolId: EntityId): Promise<Page<UserDo>> {
		const [fromclasses, fromMoinSchuleClasses] = await Promise.all([
			this.getStudentIdsOfUsersClasses(userId, schoolId),
			this.getStudentIdsOfUsersMoinSchuleClasses(userId),
		]);
		const validIds = [...new Set([...fromclasses, ...fromMoinSchuleClasses])];

		const students = await this.getAllStudentsOfSchool(schoolId);
		const filtered = students.data.filter((student) => student.id && validIds.includes(student.id));

		const result = { data: filtered, total: filtered.length };
		return result;
	}

	private async getAllStudentsOfSchool(schoolId: EntityId): Promise<Page<UserDo>> {
		const result = await this.userService.findBySchoolRole(schoolId, RoleName.STUDENT);
		return result;
	}

	private checkHasPermissionToAccessTeachers(user: User): void {
		this.authorizationService.checkAllPermissions(user, [Permission.SCHOOL_LIST_DISCOVERABLE_TEACHERS]);
	}

	private isUserOfSchool(user: User, schoolId: EntityId): boolean {
		const isUserOfSchool = user.school.id === schoolId;
		return isUserOfSchool;
	}

	private async getStudentIdsOfUsersClasses(userId: EntityId, schoolId: EntityId): Promise<EntityId[]> {
		const classes = await this.classService.findAllByUserId(userId);
		const currentYear = await this.schoolService.getCurrentYear(schoolId);

		const currentClasses = classes.filter((clazz) => clazz.year === currentYear?.id);

		const attendeeIds = currentClasses.flatMap((clazz) => clazz.userIds);

		return attendeeIds;
	}

	private async getStudentIdsOfUsersMoinSchuleClasses(userId: EntityId): Promise<EntityId[]> {
		const classes = await this.moinSchuleClassService.findByUserId(userId);

		const currentClasses = classes.filter((clazz) => clazz.isCurrentlyInValidPeriod());

		const attendeeIds = currentClasses.flatMap((clazz) => clazz.users.map((user) => user.userId));

		return attendeeIds;
	}

	public async getMaintenanceStatus(schoolId: EntityId, userId: EntityId): Promise<MaintenanceResponse> {
		const [school, user, schoolYears, schoolUsesLdap] = await Promise.all([
			this.schoolService.getSchoolById(schoolId),
			this.authorizationService.getUserWithPermissions(userId),
			this.schoolYearService.getAllSchoolYears(),
			this.schoolService.hasLdapSystem(schoolId),
		]);

		const authContext = AuthorizationContextBuilder.read([]);
		this.authorizationService.checkPermission(user, school, authContext);

		const maintenanceStatus: MaintenanceResponse = this.mapToMaintenanceResponseDto(
			school,
			schoolYears,
			schoolUsesLdap
		);

		return maintenanceStatus;
	}

	public async setMaintenanceStatus(
		schoolId: EntityId,
		userId: EntityId,
		maintenance: boolean
	): Promise<MaintenanceResponse> {
		const [school, user, schoolYears, schoolUsesLdap] = await Promise.all([
			this.schoolService.getSchoolById(schoolId),
			this.authorizationService.getUserWithPermissions(userId),
			this.schoolYearService.getAllSchoolYears(),
			this.schoolService.hasLdapSystem(schoolId),
		]);

		const authContext = AuthorizationContextBuilder.write([Permission.SCHOOL_EDIT]);
		this.authorizationService.checkPermission(user, school, authContext);

		if (school.inUserMigration) {
			throw new SchoolInUserMigrationLoggableException(school);
		}

		if (this.isSchoolAlreadyInNextYear(school)) {
			throw new SchoolAlreadyInNextYearLoggableException(school);
		}

		if (maintenance) {
			if (school.isInMaintenance()) {
				throw new SchoolAlreadyInMaintenanceLoggableException(school);
			}

			if (schoolUsesLdap) {
				school.inMaintenanceSince = new Date();
			} else {
				this.bumpYear(school, schoolYears);
			}
		} else {
			if (!school.isInMaintenance()) {
				throw new SchoolNotInMaintenanceLoggableException(school);
			}

			this.bumpYear(school, schoolYears);
		}

		const savedSchool: School = await this.schoolService.save(school);

		const maintenanceStatus: MaintenanceResponse = this.mapToMaintenanceResponseDto(
			savedSchool,
			schoolYears,
			schoolUsesLdap
		);

		return maintenanceStatus;
	}

	private isSchoolAlreadyInNextYear(school: School): boolean {
		return !!school.currentYear && new Date().getFullYear() <= school.currentYear.startDate.getFullYear();
	}

	private bumpYear(school: School, schoolYears: SchoolYear[]): void {
		const { nextYear } = SchoolYearHelper.computeActiveAndLastAndNextYear(school, schoolYears);

		school.currentYear = nextYear;
		school.inMaintenanceSince = undefined;
	}

	private mapToMaintenanceResponseDto(
		school: School,
		schoolYears: SchoolYear[],
		schoolUsesLdap: boolean
	): MaintenanceResponse {
		const { activeYear, nextYear } = SchoolYearHelper.computeActiveAndLastAndNextYear(school, schoolYears);

		const response: MaintenanceResponse = MaintenanceResponseMapper.mapToResponse(
			school,
			schoolUsesLdap,
			activeYear,
			nextYear
		);

		if (school.inUserMigration) {
			response.schoolUsesLdap = false;
			response.maintenance.active = false;
			response.maintenance.startDate = undefined;
		}

		return response;
	}
}
