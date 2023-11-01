import { SchoolYear } from '../do';
import { SchoolYearDto } from '../dto';

export class SchoolYearDtoMapper {
	public static mapToDto(schoolYear: SchoolYear): SchoolYearDto {
		const schoolYearProps = schoolYear.getProps();

		const dto = new SchoolYearDto({
			id: schoolYear.id,
			name: schoolYearProps.name,
			startDate: schoolYearProps.startDate,
			endDate: schoolYearProps.endDate,
		});

		return dto;
	}

	public static mapToDtos(schoolYears: SchoolYear[]): SchoolYearDto[] {
		const dtos = schoolYears.map((schoolYear) => this.mapToDto(schoolYear));

		return dtos;
	}
}
