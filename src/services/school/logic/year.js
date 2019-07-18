class SchoolYears {
	constructor(years, school) {
		/** retrieves custom year for given year id
		 * @param yearId ObjectId
		*/
		const customYearsOf = yearId => (school.customYears || [])
			.filter(year => String(year._id) === String(yearId));
		/** overrides year values with custom year values if they have been defined */
		const generateSchoolYears = () => this.years.map((year) => {
			const customYearForYear = customYearsOf(year._id);
			if (customYearForYear.length !== 0) {
				const customYear = year;
				if (customYearForYear.startDate) {
					customYear.startDate = customYearForYear.startDate;
				}
				if (customYearForYear.endDate) {
					customYear.endDate = customYearForYear.endDate;
				}
				return customYear;
			}
			return year;
		});
		this.years = years.sort(this.yearCompare);
		this.customYears = school.customYears.sort(this.yearCompare);
		this.schoolYears = generateSchoolYears();
	}

	/** sorts years by their name value */
	yearCompare(year, otherYear) {
		return (year.name.toString()).localeCompare(otherYear.name);
	}

	getSchoolYears() {
		return this.schoolYears;
	}

	getCurrentYear() {
		return this.currentYear;
	}

	getActiveYear() {
		const now = Date.now();
		const activeYears = this.schoolYears
			.filter(year => year.startDate <= now
			&& year.endDate >= now);
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
		const now = Date.now();
		const nextYears = this.schoolYears
			.filter(year => year.startDate >= now);
		if (nextYears.length === 1) {
			return nextYears[0];
		}
		const nextYearMinStartDate = nextYears
			.reduce((min, p) => (p.startDate < min ? p.startDate : min), nextYears[0].startDate);
		return nextYearMinStartDate;
	}

	getLastYear() {
		const now = Date.now();
		const lastYears = this.schoolYears.filter(year => year.endDate < now);
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

module.exports = SchoolYears;
