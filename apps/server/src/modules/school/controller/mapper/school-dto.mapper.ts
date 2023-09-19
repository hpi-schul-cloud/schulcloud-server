import { School } from '../../domain/school';
import { SchoolListResponse, SchoolResponse } from '../dto';

export class SchoolDtoMapper {
	public static mapToResponse(school: School): SchoolResponse {
		const response = new SchoolResponse({
			name: school.getProps().name,
			officialSchoolNumber: school.getProps().officialSchoolNumber,
		});

		return response;
	}

	public static mapToListResponse(schools: School[]): SchoolListResponse {
		const dtos = schools.map((school) => this.mapToResponse(school));

		const list = new SchoolListResponse(dtos, dtos.length);

		return list;
	}
}
