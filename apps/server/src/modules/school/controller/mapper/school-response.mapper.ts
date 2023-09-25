import { County, FederalState, School, SchoolYear, System } from '../../domain';
import { SchoolListResponse, SchoolResponse } from '../dto';
import { CountyResponse } from '../dto/county.response';
import { FederalStateResponse } from '../dto/federal-state.response';
import { SchoolReducedResponse } from '../dto/school-reduced.response';
import { SchoolYearResponse } from '../dto/school-year.response';
import { SystemResponse } from '../dto/system.response';

export class SchoolResponseMapper {
	public static mapToResponse(school: School): SchoolResponse {
		const federalState = this.mapToFederalStateResponse(school.federalState);
		const schoolYear = school.schoolYear && this.mapToSchoolYearResponse(school.schoolYear);
		const systems = school.systems && school.systems.map((system) => this.mapToSystemResponse(system));

		// TODO: Do we want to access the props via getProps() here or do we want getters?
		// I added getters for federalState and schoolYear because there are conditions with them below
		// and then the code is a easier to read. But I wasn't really sure.
		// Do we want any fixed criteria for when to add getters?
		const res = new SchoolResponse({
			id: school.id,
			name: school.getProps().name,
			officialSchoolNumber: school.getProps().officialSchoolNumber,
			schoolYear,
			federalState,
			county: school.getProps().county,
			purpose: school.getProps().purpose,
			features: school.getProps().features,
			systems,
		});

		return res;
	}

	public static mapToListResponse(schools: School[]): SchoolListResponse {
		const dtos = schools.map((school) => this.mapToReducedResponse(school));

		const list = new SchoolListResponse(dtos, dtos.length);

		return list;
	}

	private static mapToReducedResponse(school: School): SchoolReducedResponse {
		const res = new SchoolReducedResponse({
			id: school.id,
			name: school.getProps().name,
			purpose: school.getProps().purpose,
		});

		return res;
	}

	private static mapToFederalStateResponse(federalState: FederalState): FederalStateResponse {
		const counties = federalState.counties && this.mapToCountyResponses(federalState.counties);

		const res = new FederalStateResponse({
			id: federalState.id,
			name: federalState.getProps().name,
			abbreviation: federalState.getProps().abbreviation,
			logoUrl: federalState.getProps().logoUrl,
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
		const res = new SchoolYearResponse({
			id: schoolYear.id,
			name: schoolYear.getProps().name,
			startDate: schoolYear.getProps().startDate,
			endDate: schoolYear.getProps().endDate,
		});

		return res;
	}

	private static mapToSystemResponse(system: System) {
		const res = new SystemResponse({
			type: system.getProps().type,
			url: system.getProps().url,
			alias: system.getProps().alias,
			displayName: system.getProps().displayName,
			oauthConfig: system.getProps().oauthConfig,
			oidcConfig: system.getProps().oidcConfig,
			ldapConfig: system.getProps().ldapConfig,
			provisioningStrategy: system.getProps().provisioningStrategy,
			provisioningUrl: system.getProps().provisioningUrl,
		});

		return res;
	}
}
