import { PaginationParams } from '@shared/controller';
import { County, FederalState, School, SchoolYear, System } from '../../domain';
import { SchoolListResponse, SchoolResponse } from '../dto';
import { CountyResponse } from '../dto/county.response';
import { FederalStateResponse } from '../dto/federal-state.response';
import { SchoolReducedResponse } from '../dto/school-reduced.response';
import { SchoolYearResponse } from '../dto/school-year.response';
import { SystemResponse } from '../dto/system.response';

export class SchoolResponseMapper {
	public static mapToResponse(school: School): SchoolResponse {
		const schoolProps = school.getProps();

		const federalState = this.mapToFederalStateResponse(schoolProps.federalState);
		const currentYear = schoolProps.currentYear && this.mapToSchoolYearResponse(schoolProps.currentYear);
		const features = schoolProps.features && Array.from(schoolProps.features);
		const systems = schoolProps.systems?.map((system) => this.mapToSystemResponse(system));

		// TODO: Do we want to access the props via getProps() here or do we want getters?
		// I added getters for federalState and schoolYear because there are conditions with them below
		// and then the code is a easier to read. But I wasn't really sure.
		// Do we want any fixed criteria for when to add getters?
		const res = new SchoolResponse({
			id: school.id,
			name: schoolProps.name,
			officialSchoolNumber: schoolProps.officialSchoolNumber,
			currentYear,
			federalState,
			county: schoolProps.county,
			purpose: schoolProps.purpose,
			features,
			systems,
			inMaintenance: school.isInMaintenance(),
			isExternal: school.isExternal(),
			logo_dataUrl: schoolProps.logo_dataUrl,
		});

		return res;
	}

	public static mapToListResponse(schools: School[], pagination: PaginationParams): SchoolListResponse {
		const dtos = schools.map((school) => this.mapToReducedResponse(school));

		const list = new SchoolListResponse(dtos, dtos.length, pagination.skip, pagination.limit);

		return list;
	}

	private static mapToReducedResponse(school: School): SchoolReducedResponse {
		const schoolProps = school.getProps();

		const res = new SchoolReducedResponse({
			id: school.id,
			name: schoolProps.name,
			purpose: schoolProps.purpose,
		});

		return res;
	}

	// TODO: Create own mappers for other DOs!
	private static mapToFederalStateResponse(federalState: FederalState): FederalStateResponse {
		const federalStateProps = federalState.getProps();

		const counties = federalStateProps.counties && this.mapToCountyResponses(federalStateProps.counties);

		const res = new FederalStateResponse({
			id: federalState.id,
			name: federalStateProps.name,
			abbreviation: federalStateProps.abbreviation,
			logoUrl: federalStateProps.logoUrl,
			counties,
		});

		return res;
	}

	private static mapToCountyResponses(counties: County[]): CountyResponse[] {
		const res = counties.map((county) => this.mapToCountyResponse(county));

		return res;
	}

	private static mapToCountyResponse(county: County): CountyResponse {
		const res = new CountyResponse({
			name: county.name,
			countyId: county.countyId,
			antaresKey: county.antaresKey,
		});

		return res;
	}

	private static mapToSchoolYearResponse(schoolYear: SchoolYear): SchoolYearResponse {
		const schoolYearProps = schoolYear.getProps();

		const res = new SchoolYearResponse({
			id: schoolYear.id,
			name: schoolYearProps.name,
			startDate: schoolYearProps.startDate,
			endDate: schoolYearProps.endDate,
		});

		return res;
	}

	private static mapToSystemResponse(system: System) {
		const systemProps = system.getProps();

		const res = new SystemResponse({
			id: system.id,
			type: systemProps.type,
			url: systemProps.url,
			alias: systemProps.alias,
			displayName: systemProps.displayName,
			oauthConfig: systemProps.oauthConfig,
			oidcConfig: systemProps.oidcConfig,
			ldapConfig: systemProps.ldapConfig,
			provisioningStrategy: systemProps.provisioningStrategy,
			provisioningUrl: systemProps.provisioningUrl,
		});

		return res;
	}
}
