import { SchoolYearDto } from './school-year.dto';

export class YearsDto {
	constructor(props: YearsDto) {
		this.schoolYears = props.schoolYears;
		this.defaultYear = props.defaultYear;
		this.activeYear = props.activeYear;
		this.lastYear = props.lastYear;
		this.nextYear = props.nextYear;
	}

	schoolYears: SchoolYearDto[];

	activeYear?: SchoolYearDto;

	defaultYear?: SchoolYearDto;

	lastYear?: SchoolYearDto;

	nextYear?: SchoolYearDto;
}
