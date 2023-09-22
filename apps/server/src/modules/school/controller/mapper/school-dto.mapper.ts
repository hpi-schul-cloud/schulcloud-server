import { County, FederalState, School, SchoolYear } from '../../domain';
import { SchoolListResponse, SchoolResponse } from '../dto';
import { CountyResponse } from '../dto/county.response';
import { FederalStateResponse } from '../dto/federal-state.response';
import { SchoolYearResponse } from '../dto/school-year.response';

export class SchoolDtoMapper {
	public static mapToResponse(school: School): SchoolResponse {
		const federalState = this.mapToFederalStateResponse(school.federalState);
		const schoolYear = school.schoolYear && this.mapToSchoolYearResponse(school.schoolYear);

		const res = new SchoolResponse({
			id: school.id,
			name: school.getProps().name,
			officialSchoolNumber: school.getProps().officialSchoolNumber,
			federalState,
			schoolYear,
		});

		return res;
	}

	public static mapToListResponse(schools: School[]): SchoolListResponse {
		const dtos = schools.map((school) => this.mapToResponse(school));

		const list = new SchoolListResponse(dtos, dtos.length);

		return list;
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
}
