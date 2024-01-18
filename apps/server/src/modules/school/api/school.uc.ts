import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { SortOrder } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { SchoolQuery, SchoolService, SchoolYearService, SchoolYearUtils } from '../domain';
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

	public async getSchoolById(schoolId: EntityId, userId: EntityId): Promise<SchoolResponse> {
		const [school, user, schoolYears] = await Promise.all([
			this.schoolService.getSchoolById(schoolId),
			this.authorizationService.getUserWithPermissions(userId),
			this.schoolYearService.getAllSchoolYears(),
		]);

		const authContext = AuthorizationContextBuilder.read([]);
		this.authorizationService.checkPermission(user, school, authContext);

		const { activeYear, lastYear, nextYear } = SchoolYearUtils.computeActiveAndLastAndNextYear(school, schoolYears);
		const yearsResponse = YearsResponseMapper.mapToResponse(schoolYears, activeYear, lastYear, nextYear);

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

		const schools = await this.schoolService.getSchoolsForExternalInvite(query, ownSchoolId, findOptions);

		const dtos = SchoolResponseMapper.mapToListForExternalInviteResponses(schools);

		return dtos;
	}

	public async doesSchoolExist(schoolId: EntityId): Promise<boolean> {
		const result = await this.schoolService.doesSchoolExist(schoolId);

		return result;
	}
}
