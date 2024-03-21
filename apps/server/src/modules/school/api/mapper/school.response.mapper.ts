import { School, SchoolForLdapLogin } from '../../domain';
import { SchoolForExternalInviteResponse, SchoolResponse, YearsResponse } from '../dto/response';
import { SchoolForLdapLoginResponse } from '../dto/response/school-for-ldap-login.response';
import { CountyResponseMapper } from './county.response.mapper';
import { FederalStateResponseMapper } from './federal-state.response.mapper';
import { SystemResponseMapper } from './school-systems.response.mapper';
import { SchoolYearResponseMapper } from './school-year.response.mapper';

export class SchoolResponseMapper {
	public static mapToResponse(school: School, years: YearsResponse): SchoolResponse {
		const schoolProps = school.getProps();

		const federalState = FederalStateResponseMapper.mapToResponse(schoolProps.federalState);
		const currentYear = schoolProps.currentYear && SchoolYearResponseMapper.mapToResponse(schoolProps.currentYear);
		const features = Array.from(schoolProps.features);
		const county = schoolProps.county && CountyResponseMapper.mapToResponse(schoolProps.county);
		const systemIds = schoolProps.systemIds ?? [];
		const instanceFeatures = Array.from(schoolProps.instanceFeatures ?? []);

		const dto = new SchoolResponse({
			...schoolProps,
			currentYear,
			federalState,
			features,
			county,
			systemIds,
			inUserMigration: schoolProps.inUserMigration,
			inMaintenance: school.isInMaintenance(),
			isExternal: school.isExternal(),
			years,
			instanceFeatures,
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

	public static mapToListForLdapLoginResponses(schools: SchoolForLdapLogin[]): SchoolForLdapLoginResponse[] {
		const dtos = schools.map((school) => SchoolResponseMapper.mapToLdapLoginResponse(school));

		return dtos;
	}

	private static mapToLdapLoginResponse(school: SchoolForLdapLogin): SchoolForLdapLoginResponse {
		const schoolProps = school.getProps();

		const systems = SystemResponseMapper.mapToLdapLoginResponses(schoolProps.systems);

		const dto = new SchoolForLdapLoginResponse({
			id: school.id,
			name: schoolProps.name,
			systems,
		});

		return dto;
	}
}
