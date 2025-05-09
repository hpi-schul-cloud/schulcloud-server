import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { RoleName } from '@modules/role';
import { UserDo, UserService } from '@modules/user';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject';
import { Permission, SortOrder } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { School, SchoolQuery, SchoolService, SchoolYear, SchoolYearHelper, SchoolYearService } from '../domain';
import {
	SchoolExistsResponse,
	SchoolForExternalInviteResponse,
	SchoolForLdapLoginResponse,
	SchoolResponse,
	SchoolSystemResponse,
	SchoolUpdateBodyParams,
	SchoolUserListResponse,
} from './dto';
import { SchoolResponseMapper, SchoolUserResponseMapper, SystemResponseMapper } from './mapper';
import { YearsResponseMapper } from './mapper/years.response.mapper';

@Injectable()
export class SchoolUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
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
		const [school, user] = await Promise.all([
			this.schoolService.getSchoolById(schoolId),
			this.authorizationService.getUserWithPermissions(userId),
		]);

		this.checkHasPermissionToAccessTeachers(user);

		const isUserOfSchool = this.isSchoolInternalUser(user, school, [Permission.TEACHER_LIST]);

		let result: Page<UserDo>;
		if (isUserOfSchool) {
			result = await this.userService.findBySchoolRole(schoolId, RoleName.TEACHER);
		} else {
			result = await this.userService.findPublicTeachersBySchool(schoolId);
		}

		const responseDto = SchoolUserResponseMapper.mapToListResponse(result);
		return responseDto;
	}

	public async getSchoolStudents(schoolId: EntityId, userId: EntityId): Promise<SchoolUserListResponse> {
		const [school, user] = await Promise.all([
			this.schoolService.getSchoolById(schoolId),
			this.authorizationService.getUserWithPermissions(userId),
		]);

		this.checkHasPermissionToAccessStudents(user);

		const isUserOfSchool = this.isSchoolInternalUser(user, school, [Permission.STUDENT_LIST]);

		let result: Page<UserDo> = { data: [], total: 0 };
		if (isUserOfSchool) {
			result = await this.userService.findBySchoolRole(schoolId, RoleName.STUDENT);
		}

		const responseDto = SchoolUserResponseMapper.mapToListResponse(result);
		return responseDto;
	}

	private checkHasPermissionToAccessTeachers(user: User) {
		this.authorizationService.checkAllPermissions(user, [Permission.TEACHER_LIST]);
	}

	private checkHasPermissionToAccessStudents(user: User) {
		this.authorizationService.checkAllPermissions(user, [Permission.STUDENT_LIST]);
	}

	private isSchoolInternalUser(user: User, school: School, permissions: Permission[]): boolean {
		const authContext = AuthorizationContextBuilder.read(permissions);
		const isUserOfSchool = this.authorizationService.hasPermission(user, school, authContext);
		return isUserOfSchool;
	}
}
