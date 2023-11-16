import { School } from '../../domain';
import { SchoolForExternalInviteResponse, SchoolResponse, YearsResponse } from '../dto/response';
import { FederalStateResponseMapper } from './federal-state.response.mapper';
import { SchoolYearResponseMapper } from './school-year.response.mapper';
import { SystemResponseMapper } from './system.response.mapper';

export class SchoolResponseMapper {
	public static mapToResponse(school: School, years: YearsResponse): SchoolResponse {
		const schoolProps = school.getProps();

		const federalState = FederalStateResponseMapper.mapToResponse(schoolProps.federalState);
		const currentYear = schoolProps.currentYear && SchoolYearResponseMapper.mapToResponse(schoolProps.currentYear);
		const features = schoolProps.features && Array.from(schoolProps.features);
		const systems = schoolProps.systems?.map((system) => SystemResponseMapper.mapToResponse(system));

		const dto = new SchoolResponse({
			...schoolProps,
			currentYear,
			federalState,
			features,
			systems,
			inMaintenance: school.isInMaintenance(),
			isExternal: school.isExternal(),
			years,
		});

		return dto;
	}

	public static mapToListForExternalInviteResponses(schools: School[]): SchoolForExternalInviteResponse[] {
		const dtos = schools.map((school) => this.mapToExternalInviteResponse(school));

		return dtos;
	}

	private static mapToExternalInviteResponse(school: School): SchoolForExternalInviteResponse {
		const schoolProps = school.getProps();

		const dto = new SchoolForExternalInviteResponse({
			id: school.id,
			name: schoolProps.name,
			purpose: schoolProps.purpose,
		});

		return dto;
	}
}
