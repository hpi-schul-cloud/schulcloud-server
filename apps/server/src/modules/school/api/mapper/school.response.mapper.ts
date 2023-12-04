import { School } from '../../domain';
import { SchoolForExternalInviteResponse, SchoolResponse, YearsResponse } from '../dto/response';

export class SchoolResponseMapper {
	public static mapToResponse(school: School, years: YearsResponse): SchoolResponse {
		const schoolProps = school.getProps();

		const federalState = schoolProps.federalState.getProps();
		const currentYear = schoolProps.currentYear?.getProps();
		const features = schoolProps.features && Array.from(schoolProps.features);
		const systems = schoolProps.systems?.map((system) => system.getProps());

		const res = {
			...schoolProps,
			currentYear,
			federalState,
			features,
			systems,
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
