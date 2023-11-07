import { Injectable } from '@nestjs/common';
import { IPagination } from '@shared/domain/interface/find-options';
import { EntityId } from '@shared/domain/types/entity-id';
import { AuthorizationContextBuilder } from '@modules/authorization/domain/mapper/authorization-context.builder';
import { AuthorizationService } from '@modules/authorization/domain/service/authorization.service';
import { School, SchoolYear } from '../do';
import { SchoolDto, SchoolForExternalInviteDto, SchoolYearDto, YearsDto } from '../dto';
import { SchoolDtoMapper, SchoolYearDtoMapper } from '../mapper';
import { SchoolService, SchoolYearService } from '../service';
import { SchoolQuery } from '../type';

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

		const yearsDto = await this.createYearsDto(school);

		const dto = SchoolDtoMapper.mapToDto(school, yearsDto);

		return dto;
	}

	public async getSchoolListForExternalInvite(
		query: SchoolQuery,
		pagination: IPagination,
		ownSchoolId: EntityId
	): Promise<SchoolForExternalInviteDto[]> {
		const schools = await this.schoolService.getAllSchools(query, pagination);

		// TODO: Do we want authorization here? At the moment there is no fitting permission.

		const dtos = SchoolDtoMapper.mapToListForExternalInviteDtos(schools);

		const dtosWithoutOwnSchool = dtos.filter((dto) => dto.id !== ownSchoolId);

		return dtosWithoutOwnSchool;
	}

	private async createYearsDto(school: School): Promise<YearsDto> {
		const schoolYears = await this.schoolYearService.getAllSchoolYears();
		const schoolYearDtos = SchoolYearDtoMapper.mapToDtos(schoolYears);

		const activeYear = this.computeActiveYear(school, schoolYears);
		const nextYear = this.computeNextYear(schoolYears, activeYear);
		const lastYear = this.computeLastYear(schoolYears, activeYear);
		const defaultYear = activeYear || nextYear;

		const years = {
			schoolYears: schoolYearDtos,
			activeYear,
			nextYear,
			lastYear,
			defaultYear,
		};

		return years;
	}

	private computeActiveYear(school: School, schoolYears: SchoolYear[]): SchoolYearDto | undefined {
		let activeYear = school.getProps().currentYear;

		if (!activeYear) {
			const now = new Date();
			activeYear = schoolYears.find(
				(schoolYear) => schoolYear.getProps().startDate <= now && schoolYear.getProps().endDate >= now
			);
		}

		const dto = activeYear && SchoolYearDtoMapper.mapToDto(activeYear);

		return dto;
	}

	private computeNextYear(schoolYears: SchoolYear[], activeYear?: SchoolYearDto): SchoolYearDto | undefined {
		const indexOfActiveYear = schoolYears.findIndex((schoolYear) => schoolYear.id === activeYear?.id);

		const nextYear = schoolYears[indexOfActiveYear + 1];

		const dto = nextYear && SchoolYearDtoMapper.mapToDto(nextYear);

		return dto;
	}

	private computeLastYear(schoolYears: SchoolYear[], activeYear?: SchoolYearDto): SchoolYearDto | undefined {
		const indexOfActiveYear = schoolYears.findIndex((schoolYear) => schoolYear.id === activeYear?.id);

		const lastYear = schoolYears[indexOfActiveYear - 1];

		const dto = lastYear && SchoolYearDtoMapper.mapToDto(lastYear);

		return dto;
	}
}
