import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { PaginationParams } from '@shared/controller';
import { Page, UserDO } from '@shared/domain/domainobject';
import { User } from '@shared/domain/entity';
import { Permission, RoleName, SortOrder } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { UserService } from '@src/modules/user';
import { School, SchoolQuery, SchoolService, SchoolYear, SchoolYearHelper, SchoolYearService } from '../domain';
import { SchoolUpdateBodyParams } from './dto/param';
import {
	SchoolExistsResponse,
	SchoolForExternalInviteResponse,
	SchoolResponse,
	SchoolSystemResponse,
} from './dto/response';
import { SchoolForLdapLoginResponse } from './dto/response/school-for-ldap-login.response';
import { SchoolUserListResponse } from './dto/response/school-user.response';
import { SchoolResponseMapper, SystemResponseMapper, SchoolUserResponseMapper } from './mapper';
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

	public async getSchoolTeachers(
		schoolId: EntityId,
		userId: EntityId,
		pagination?: PaginationParams
	): Promise<SchoolUserListResponse> {
		const [school, user] = await Promise.all([
			this.schoolService.getSchoolById(schoolId),
			this.authorizationService.getUserWithPermissions(userId),
		]);

		this.checkHasPermissionToAccessTeachers(user);

		const isUserOfSchool = this.isSchoolInternalUser(user, school);

		let result: Page<UserDO>;
		if (isUserOfSchool) {
			result = await this.userService.findBySchoolRole(schoolId, RoleName.TEACHER, { pagination });
		} else {
			result = await this.userService.findPublicTeachersBySchool(schoolId, { pagination });
		}

		const responseDto = SchoolUserResponseMapper.mapToListResponse(result, pagination);
		return responseDto;
	}

	private checkHasPermissionToAccessTeachers(user: User) {
		this.authorizationService.checkAllPermissions(user, [Permission.TEACHER_LIST]);
	}

	private isSchoolInternalUser(user: User, school: School): boolean {
		const authContext = AuthorizationContextBuilder.read([Permission.TEACHER_LIST]);
		const isUserOfSchool = this.authorizationService.hasPermission(user, school, authContext);
		return isUserOfSchool;
	}
}
