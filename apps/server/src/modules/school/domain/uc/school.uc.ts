import { AuthorizationContextBuilder } from '@modules/authorization/domain/mapper/authorization-context.builder';
import { AuthorizationService } from '@modules/authorization/domain/service/authorization.service';
import { Injectable } from '@nestjs/common';
import { SortOrder } from '@shared/domain';
import { EntityId } from '@shared/domain/types/entity-id';
import { SchoolDto, SchoolForExternalInviteDto } from '../dto';
import { SchoolDtoMapper } from '../mapper';
import { YearsDtoMapper } from '../mapper/years.dto.mapper';
import { SchoolQuery } from '../query';
import { SchoolService, SchoolYearService } from '../service';

@Injectable()
export class SchoolUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly schoolService: SchoolService,
		private readonly schoolYearService: SchoolYearService
	) {}

	public async getSchool(schoolId: EntityId, userId: EntityId): Promise<SchoolDto> {
		const school = await this.schoolService.getSchool(schoolId);

		const user = await this.authorizationService.getUserWithPermissions(userId);
		const authContext = AuthorizationContextBuilder.read([]);
		this.authorizationService.checkPermission(user, school, authContext);

		const schoolYears = await this.schoolYearService.getAllSchoolYears();
		const yearsDto = YearsDtoMapper.mapToDto(school, schoolYears);

		const dto = SchoolDtoMapper.mapToDto(school, yearsDto);

		return dto;
	}

	public async getSchoolListForExternalInvite(
		query: SchoolQuery,
		ownSchoolId: EntityId
	): Promise<SchoolForExternalInviteDto[]> {
		const findOptions = {
			order: {
				name: SortOrder.asc,
			},
		};

		const schools = await this.schoolService.getAllSchoolsExceptOwnSchool(query, ownSchoolId, findOptions);

		// TODO: Do we want authorization here? At the moment there is no fitting permission.

		const dtos = SchoolDtoMapper.mapToListForExternalInviteDtos(schools);

		return dtos;
	}
}
