import { PaginationParams } from '@shared/controller';
import { SchoolDto, SchoolForExternalInviteDto } from '../../../domain';
import { SchoolForExternalInviteResponse, SchoolListForExternalInviteResponse, SchoolResponse } from '../response';
import { FederalStateResponseMapper } from './federal-state.response.mapper';
import { SchoolYearResponseMapper } from './school-year.response.mapper';
import { SystemResponseMapper } from './system.response.mapper';
import { YearsResponseMapper } from './years.response.mapper';

export class SchoolResponseMapper {
	public static mapToResponse(school: SchoolDto): SchoolResponse {
		const federalState = FederalStateResponseMapper.mapToResponse(school.federalState);
		const currentYear = school.currentYear && SchoolYearResponseMapper.mapToResponse(school.currentYear);
		const features = school.features && Array.from(school.features);
		const systems = school.systems?.map((system) => SystemResponseMapper.mapToResponse(system));
		const years = YearsResponseMapper.mapToResponse(school.years);

		const res = new SchoolResponse({
			...school,
			federalState,
			currentYear,
			features,
			systems,
			years,
		});

		return res;
	}

	public static mapToListForExternalInviteResponse(
		schools: SchoolForExternalInviteDto[],
		pagination: PaginationParams
	): SchoolListForExternalInviteResponse {
		const dtos = schools.map((school) => this.mapToExternalInviteResponse(school));

		const list = new SchoolListForExternalInviteResponse(dtos, dtos.length, pagination.skip, pagination.limit);

		return list;
	}

	private static mapToExternalInviteResponse(school: SchoolForExternalInviteDto): SchoolForExternalInviteResponse {
		const res = new SchoolForExternalInviteResponse(school);

		return res;
	}
}
