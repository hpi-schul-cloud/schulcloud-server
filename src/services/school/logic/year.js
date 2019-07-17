const { yearModel: YearModel, schoolModel: SchoolModel } = require('../model');

class SchoolYears {
	constructor(years, customYears, currentYear) {
		/** retrieves custom year for given year id
		 * @param yearId ObjectId
		*/
		const customYear = yearId => customYears.filter(year => String(year._id) === String(yearId));
		/** overrides year values with custom year values if they have been defined */
		const generateSchoolYears = () => this.years.map((year) => {
			const customYearForYear = customYear(year._id, customYears);
			if (customYearForYear.length !== 0) {
				return customYearForYear[0];
			}
			return year;
		});
		this.years = years.sort(this.yearCompare);
		this.customYears = customYears.sort(this.yearCompare);
		this.currentYear = currentYear;
		this.schoolYears = generateSchoolYears();
	}

	/** sorts years by their name value */
	static yearCompare(year, otherYear) {
		return (year.name.toString()).localeCompare(otherYear.name);
	}

	/** reduce a date to day, month, and year value */
	static removeHours(date) {
		date.setHours(0, 0, 0, 0);
	}

	getSchoolYears() {
		return this.schoolYears;
	}

	getCurrentYear() {
		return this.currentYear;
	}

	getActiveYear() {
		const today = this.removeHours(new Date());
		const activeYears = this.schoolYears
			.filter(year => this.removeHours(year.startDate) <= today
			&& this.removeHours(year.endDate) >= today);
		if (activeYears.length !== 0) {
			return activeYears[0];
		}
		return null;
	}

	/** returns the active or otherwise the next year.
	 * this may fail if no next year is available!
	 */
	getDefaultYear() {
		return this.getActiveYear() || this.getNextYear();
	}

	getNextYear() {
		const today = this.removeHours(new Date());
		const nextYears = this.schoolYears.filter(year => this.removeHours(year.startDate) >= today);
		if (nextYears.length === 1) {
			return nextYears[0];
		}
		const nextYearMinStartDate = nextYears
			.reduce((min, p) => (p.startDate < min ? p.startDate : min), nextYears[0].startDate);
		return nextYearMinStartDate;
	}

	getLastYear() {
		const today = this.removeHours(new Date());
		const lastYears = this.schoolYears.filter(year => this.removeHours(year.endDate) < today);
		if (lastYears.length === 1) {
			return lastYears[0];
		}
		const lastYearMaxEndDate = lastYears
			.reduce((max, p) => (p.endDate > max ? p.endDate : max), lastYears[0].endDate);
		return lastYearMaxEndDate;
	}

	/**
 *
 *
 * @param {ObjectId} yearId the id of a year
 * @returns
 * @memberof SchoolYears
 */
	getNextYearAfter(yearId) {
		const indexByValue = (array, value) => {
			for (let i = 0; i < array.length; i += 1) {
				if (String(array[i]._id) === value) {
					return i;
				}
			}
			return -1;
		};
		const givenYearIndex = indexByValue(this.schoolYears, String(yearId));
		const nextYearIndex = givenYearIndex + 1;
		if (givenYearIndex === -1
			|| this.schoolYears.length < nextYearIndex) {
			return null;
		}
		return this.schoolYears[nextYearIndex];
	}

	static extractStartYear(yearName) {
		return parseInt(yearName.substring(0, 4), 10);
	}

	static getDefaultEndDate(yearName) {
		const year = SchoolYears.extractStartYear(yearName);
		return Date.UTC((year + 1), 6, 1); // 1.7.(YEAR+1)
	}

	static getDefaultStartDate(yearName) {
		const year = SchoolYears.extractStartYear(yearName);
		return Date.UTC(year, 7, 1); // 1.8.YEAR
	}
}

module.exports = {
	defaultYears: () => YearModel.find().lean().exec(),
	schoolSettings: schoolId => SchoolModel
		.findById(schoolId).lean().exec().then((school) => {
			if (school == null) {
				throw new Error('could not resolve given schoolId');
			}
			const { customYears, currentYear } = school;
			return { customYears, currentYear };
		}),
	SchoolYears,
};
