class SchoolYearFacade {
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
		this.years = years.sort(SchoolYearFacade.yearCompare);
		this.customYears = (school.customYears || []).sort(SchoolYearFacade.yearCompare);
		this.schoolYears = generateSchoolYears();
	}

	/** sorts years by their name value */
	static yearCompare(year, otherYear) {
		return (year.name.toString()).localeCompare(otherYear.name);
	}

	get SchoolYears() {
		return this.schoolYears;
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
		// next year is in first place
		if (nextYears.length === 0) return null;
		return nextYears[0];
	}

	getLastYear() {
		const now = Date.now();
		const pastYears = this.schoolYears.filter(year => year.endDate < now);
		// last year is on last place
		if (pastYears.length === 0) return null;
		return pastYears[pastYears.length - 1];
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
		const year = SchoolYearFacade.extractStartYear(yearName);
		return Date.UTC((year + 1), 6, 1); // 1.7.(YEAR+1)
	}

	static getDefaultStartDate(yearName) {
		const year = SchoolYearFacade.extractStartYear(yearName);
		return Date.UTC(year, 7, 1); // 1.8.YEAR
	}

	get data() {
		return {
			schoolYears: this.schoolYears,
			activeYear: this.getActiveYear(),
			defaultYear: this.getDefaultYear(),
			nextYear: this.getNextYear(),
			lastYear: this.getLastYear(),
		};
	}
}

module.exports = SchoolYearFacade;
