import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { Permission, SortOrder } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { School, SchoolQuery, SchoolService, SchoolYear, SchoolYearHelper, SchoolYearService } from '../domain';
import { SchoolUpdateBodyParams } from './dto/param';
import {
	SchoolExistsResponse,
	SchoolForExternalInviteResponse,
	SchoolResponse,
	SchoolSystemsResponse,
} from './dto/response';
import { SchoolForLdapLoginResponse } from './dto/response/school-for-ldap-login.response';
import { SchoolResponseMapper, SystemResponseMapper } from './mapper';
import { YearsResponseMapper } from './mapper/years.response.mapper';

@Injectable()
export class SchoolUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly schoolService: SchoolService,
		private readonly schoolYearService: SchoolYearService
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

	public async getSchoolSystems(schoolId: EntityId, userId: EntityId): Promise<SchoolSystemsResponse> {
		const [school, user] = await Promise.all([
			this.schoolService.getSchoolById(schoolId),
			this.authorizationService.getUserWithPermissions(userId),
		]);

		const authContext = AuthorizationContextBuilder.read([Permission.SCHOOL_SYSTEM_VIEW]);
		this.authorizationService.checkPermission(user, school, authContext);

		const systems = await this.schoolService.getSchoolSystems(school);

		const responseDto = SystemResponseMapper.mapToSchoolSystemResponse(school, systems);

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

		const updatedSchool = await this.schoolService.updateSchool(schoolId, body);

		const responseDto = this.mapToSchoolResponseDto(updatedSchool, schoolYears);

		return responseDto;
	}

	private mapToSchoolResponseDto(school: School, schoolYears: SchoolYear[]): SchoolResponse {
		const { activeYear, lastYear, nextYear } = SchoolYearHelper.computeActiveAndLastAndNextYear(school, schoolYears);
		const yearsResponse = YearsResponseMapper.mapToResponse(schoolYears, activeYear, lastYear, nextYear);

		const dto = SchoolResponseMapper.mapToResponse(school, yearsResponse);

		return dto;
	}
}
