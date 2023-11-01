import { SchoolYearDto } from './school-year.dto';

export class YearsDto {
	constructor({ schoolYears, defaultYear, activeYear, lastYear, nextYear }: YearsDto) {
		this.schoolYears = schoolYears;
		this.defaultYear = defaultYear;
		this.activeYear = activeYear;
		this.lastYear = lastYear;
		this.nextYear = nextYear;
	}

	schoolYears: SchoolYearDto[];

	activeYear?: SchoolYearDto;

	defaultYear?: SchoolYearDto;

	lastYear?: SchoolYearDto;

	nextYear?: SchoolYearDto;
}
