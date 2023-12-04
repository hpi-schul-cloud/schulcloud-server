import { School } from '../../domain';
import { SchoolForExternalInviteResponse, SchoolResponse, YearsResponse } from '../dto/response';
import { FederalStateResponseMapper } from './federal-state.response.mapper';

export class SchoolResponseMapper {
	public static mapToResponse(school: School, years: YearsResponse): SchoolResponse {
		const schoolProps = school.getProps();

		const federalState = FederalStateResponseMapper.mapToResponse(schoolProps.federalState);
		const currentYear = schoolProps.currentYear?.getProps();
		const features = Array.from(schoolProps.features);
		const systems = schoolProps.systems?.map((system) => system.getProps());
		const county = schoolProps.county?.getProps();

		const res = {
			...schoolProps,
			currentYear,
			federalState,
			features,
			systems,
			county,
			inMaintenance: school.isInMaintenance(),
			isExternal: school.isExternal(),
			years,
		};

		return res;
	}

	public static mapToListForExternalInviteResponses(schools: School[]): SchoolForExternalInviteResponse[] {
		const dtos = schools.map((school) => SchoolResponseMapper.mapToExternalInviteResponse(school));

		return dtos;
	}

	private static mapToExternalInviteResponse(school: School): SchoolForExternalInviteResponse {
		const schoolProps = school.getProps();

		const res = {
			id: school.id,
			name: schoolProps.name,
		};

		return res;
	}
}
