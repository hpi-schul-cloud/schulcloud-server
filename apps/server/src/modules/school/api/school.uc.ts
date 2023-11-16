import { AuthorizationContextBuilder } from '@modules/authorization/domain/mapper/authorization-context.builder';
import { AuthorizationService } from '@modules/authorization/domain/service/authorization.service';
import { Injectable } from '@nestjs/common';
import { SortOrder } from '@shared/domain';
import { EntityId } from '@shared/domain/types/entity-id';
import { SchoolQuery } from '../domain/query';
import { SchoolService, SchoolYearService } from '../domain/service';
import { SchoolForExternalInviteResponse, SchoolResponse } from './dto/response';
import { SchoolResponseMapper } from './mapper';
import { YearsResponseMapper } from './mapper/years.response.mapper';

@Injectable()
export class SchoolUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly schoolService: SchoolService,
		private readonly schoolYearService: SchoolYearService
	) {}

	public async getSchool(schoolId: EntityId, userId: EntityId): Promise<SchoolResponse> {
		const school = await this.schoolService.getSchool(schoolId);

		const user = await this.authorizationService.getUserWithPermissions(userId);
		const authContext = AuthorizationContextBuilder.read([]);
		this.authorizationService.checkPermission(user, school, authContext);

		const schoolYears = await this.schoolYearService.getAllSchoolYears();
		const yearsResponse = YearsResponseMapper.mapToResponse(school, schoolYears);

		const dto = SchoolResponseMapper.mapToResponse(school, yearsResponse);

		return dto;
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

		const schools = await this.schoolService.getAllSchoolsExceptOwnSchool(query, ownSchoolId, findOptions);

		// TODO: Do we want authorization here? At the moment there is no fitting permission.

		const dtos = SchoolResponseMapper.mapToListForExternalInviteResponses(schools);

		return dtos;
	}
}
