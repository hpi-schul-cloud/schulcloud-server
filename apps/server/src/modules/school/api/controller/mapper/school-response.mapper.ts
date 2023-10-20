import { PaginationParams } from '@shared/controller';
import { SchoolDto, SlimSchoolDto } from '../../../domain/dto';
import { SchoolResponse, SlimSchoolListResponse } from '../response';
import { SlimSchoolResponse } from '../response/school-reduced.response';
import { FederalStateMapper } from './federal-state.mapper';
import { SchoolYearMapper } from './school-year.mapper';
import { SystemMapper } from './system.mapper';

export class SchoolResponseMapper {
	public static mapToResponse(school: SchoolDto): SchoolResponse {
		const federalState = FederalStateMapper.mapToResponse(school.federalState);
		const currentYear = school.currentYear && SchoolYearMapper.mapToResponse(school.currentYear);
		const features = school.features && Array.from(school.features);
		const systems = school.systems?.map((system) => SystemMapper.mapToResponse(system));

		// TODO: Do we want to access the props via getProps() here or do we want getters?
		// I added getters for federalState and schoolYear because there are conditions with them below
		// and then the code is a easier to read. But I wasn't really sure.
		// Do we want any fixed criteria for when to add getters?
		const res = new SchoolResponse({
			...school,
			federalState,
			currentYear,
			features,
			systems,
		});

		return res;
	}

	public static mapToSlimListResponse(schools: SlimSchoolDto[], pagination: PaginationParams): SlimSchoolListResponse {
		const dtos = schools.map((school) => this.mapToSlimResponse(school));

		const list = new SlimSchoolListResponse(dtos, dtos.length, pagination.skip, pagination.limit);

		return list;
	}

	private static mapToSlimResponse(school: SlimSchoolDto): SlimSchoolResponse {
		const res = new SlimSchoolResponse(school);

		return res;
	}
}
