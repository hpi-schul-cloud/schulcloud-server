import { School } from '../do';
import { SlimSchoolDto } from '../dto';

export class SchoolMapper {
	public static mapToListOfSlimDtos(schools: School[]): SlimSchoolDto[] {
		const dtos = schools.map((school) => this.mapToSlimDto(school));

		return dtos;
	}

	public static mapToSlimDto(school: School): SlimSchoolDto {
		const schoolProps = school.getProps();

		const dto = new SlimSchoolDto({
			id: school.id,
			name: schoolProps.name,
			purpose: schoolProps.purpose,
		});

		return dto;
	}
}
