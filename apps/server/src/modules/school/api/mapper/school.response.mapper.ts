import { School } from '../../domain';
import { SchoolForExternalInviteResponse, SchoolResponse, YearsResponse } from '../dto/response';
import { SchoolForLoginResponse } from '../dto/response/school-for-login.response';
import { CountyResponseMapper } from './county.response.mapper';
import { FederalStateResponseMapper } from './federal-state.response.mapper';
import { SchoolYearResponseMapper } from './school-year.response.mapper';

export class SchoolResponseMapper {
	public static mapToResponse(school: School, years: YearsResponse): SchoolResponse {
		const schoolProps = school.getProps();

		const federalState = FederalStateResponseMapper.mapToResponse(schoolProps.federalState);
		const currentYear = schoolProps.currentYear && SchoolYearResponseMapper.mapToResponse(schoolProps.currentYear);
		const features = Array.from(schoolProps.features);
		const county = schoolProps.county && CountyResponseMapper.mapToResponse(schoolProps.county);
		const systemIds = schoolProps.systemIds ?? [];

		const dto = new SchoolResponse({
			...schoolProps,
			currentYear,
			federalState,
			features,
			county,
			systemIds,
			inMaintenance: school.isInMaintenance(),
			isExternal: school.isExternal(),
			years,
		});

		return dto;
	}

	public static mapToListForExternalInviteResponses(schools: School[]): SchoolForExternalInviteResponse[] {
		const dtos = schools.map((school) => SchoolResponseMapper.mapToExternalInviteResponse(school));

		return dtos;
	}

	private static mapToExternalInviteResponse(school: School): SchoolForExternalInviteResponse {
		const schoolProps = school.getProps();

		const dto = new SchoolForExternalInviteResponse({
			id: school.id,
			name: schoolProps.name,
		});

		return dto;
	}

	public static mapToListForLoginResponses(schools: School[]): SchoolForLoginResponse[] {
		const dtos = schools.map((school) => SchoolResponseMapper.mapToLoginResponse(school));

		return dtos;
	}

	private static mapToLoginResponse(school: School): SchoolForLoginResponse {
		const schoolProps = school.getProps();

		const dto = new SchoolForLoginResponse({
			id: school.id,
			name: schoolProps.name,
			systemIds: schoolProps.systemIds ?? [],
		});

		return dto;
	}
}
