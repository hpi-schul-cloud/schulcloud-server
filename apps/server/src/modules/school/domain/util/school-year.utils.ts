import { School, SchoolYear } from '../do';
import { MissingYearsLoggableException } from '../error';

export class SchoolYearUtils {
	public static computeActiveAndLastAndNextYear(
		school: School,
		schoolYears: SchoolYear[]
	): { activeYear: SchoolYear; lastYear: SchoolYear; nextYear: SchoolYear } {
		const activeYear = SchoolYearUtils.computeActiveYear(school, schoolYears);
		const nextYear = SchoolYearUtils.computeNextYear(schoolYears, activeYear);
		const lastYear = SchoolYearUtils.computeLastYear(schoolYears, activeYear);

		return { activeYear, lastYear, nextYear };
	}

	public static computeActiveYear(school: School, schoolYears: SchoolYear[]): SchoolYear {
		let activeYear = school.getProps().currentYear;

		if (!activeYear) {
			const now = new Date();
			activeYear = schoolYears.find(
				(schoolYear) => schoolYear.getProps().startDate <= now && schoolYear.getProps().endDate >= now
			);
		}

		if (!activeYear) {
			throw new MissingYearsLoggableException();
		}

		return activeYear;
	}

	public static computeLastYear(schoolYears: SchoolYear[], activeYear: SchoolYear): SchoolYear {
		const yearBefore = activeYear.getProps().startDate.getFullYear() - 1;
		const lastYear = schoolYears.find((schoolYear) => schoolYear.getProps().startDate.getFullYear() === yearBefore);

		if (!lastYear) {
			throw new MissingYearsLoggableException();
		}

		return lastYear;
	}

	public static computeNextYear(schoolYears: SchoolYear[], activeYear: SchoolYear): SchoolYear {
		const yearAfter = activeYear.getProps().startDate.getFullYear() + 1;
		const nextYear = schoolYears.find((schoolYear) => schoolYear.getProps().startDate.getFullYear() === yearAfter);

		if (!nextYear) {
			throw new MissingYearsLoggableException();
		}

		return nextYear;
	}
}
