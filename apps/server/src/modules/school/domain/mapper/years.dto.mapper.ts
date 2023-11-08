import { School, SchoolYear } from '../do';
import { SchoolYearDto, YearsDto } from '../dto';
import { SchoolYearDtoMapper } from './school-year.dto.mapper';

export class YearsDtoMapper {
	public static mapToDto(school: School, schoolYears: SchoolYear[]): YearsDto {
		const schoolYearDtos = SchoolYearDtoMapper.mapToDtos(schoolYears);

		const activeYear = this.computeActiveYear(school, schoolYears);
		const nextYear = this.computeNextYear(schoolYears, activeYear);
		const lastYear = this.computeLastYear(schoolYears, activeYear);
		const defaultYear = activeYear || nextYear;

		const years = {
			schoolYears: schoolYearDtos,
			activeYear,
			nextYear,
			lastYear,
			defaultYear,
		};

		return years;
	}

	private static computeActiveYear(school: School, schoolYears: SchoolYear[]): SchoolYearDto | undefined {
		let activeYear = school.getProps().currentYear;

		if (!activeYear) {
			const now = new Date();
			activeYear = schoolYears.find(
				(schoolYear) => schoolYear.getProps().startDate <= now && schoolYear.getProps().endDate >= now
			);
		}

		const dto = activeYear && SchoolYearDtoMapper.mapToDto(activeYear);

		return dto;
	}

	private static computeNextYear(schoolYears: SchoolYear[], activeYear?: SchoolYearDto): SchoolYearDto | undefined {
		const indexOfActiveYear = schoolYears.findIndex((schoolYear) => schoolYear.id === activeYear?.id);

		const nextYear = schoolYears[indexOfActiveYear + 1];

		const dto = nextYear && SchoolYearDtoMapper.mapToDto(nextYear);

		return dto;
	}

	private static computeLastYear(schoolYears: SchoolYear[], activeYear?: SchoolYearDto): SchoolYearDto | undefined {
		const indexOfActiveYear = schoolYears.findIndex((schoolYear) => schoolYear.id === activeYear?.id);

		const lastYear = schoolYears[indexOfActiveYear - 1];

		const dto = lastYear && SchoolYearDtoMapper.mapToDto(lastYear);

		return dto;
	}
}
