class SchoolYearFacade {
	/**
	 * @param [years] whole years collection
	 * @param school optional school having customYears
	 */
	constructor(years, school) {
		/** retrieves custom year for given year id
		 * @param yearId ObjectId
		 */
		const customYearsOf = (yearId) => (school.customYears || []).filter((year) => String(year._id) === String(yearId));
		/** overrides year values with custom year values if they have been defined */
		const generateSchoolYears = () =>
			this.years.map((year) => {
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
		if (school) {
			this.customYears = (school.customYears || []).sort(SchoolYearFacade.yearCompare);
			this.schoolYears = generateSchoolYears();
			if (school.currentYear) {
				this.activeYearIndex = this.schoolYears.findIndex((year) => year._id.equals(school.currentYear));
			}
		} else {
			// use defaults if there is no school present to give access to default getters
			this.customYears = [];
			this.schoolYears = this.years;
		}
	}

	/** sorts years by their name value */
	static yearCompare(year, otherYear) {
		return year.name.toString().localeCompare(otherYear.name);
	}

	/**
	 * shows the current year which may return null if there is currently summerbreak.
	 * to always get a value use defaultYear
	 *
	 * @readonly
	 * @memberof SchoolYearFacade
	 */
	get activeYear() {
		if (this.activeYearIndex != null) return this.schoolYears[this.activeYearIndex];
		const now = Date.now();
		const activeYears = this.schoolYears.filter((year) => year.startDate <= now && year.endDate >= now);
		if (activeYears.length !== 0) {
			return activeYears[0];
		}
		return null;
	}

	/**
	 * returns the active or otherwise (in summerbreak) the next school year.
	 * this may fail if no next year is available!
	 */
	get defaultYear() {
		return this.activeYear || this.nextYear;
	}

	/**
	 * shows the next year that currently has not started yet
	 *
	 * @readonly
	 * @memberof SchoolYearFacade
	 */
	get nextYear() {
		if (this.activeYearIndex != null && this.activeYearIndex + 1 < this.schoolYears.length) {
			return this.schoolYears[this.activeYearIndex + 1];
		}
		const now = Date.now();
		const nextYears = this.schoolYears.filter((year) => year.startDate >= now);
		// next year is in first place
		if (nextYears.length === 0) return null;
		return nextYears[0];
	}

	/**
	 * shows the last year that is already ended
	 *
	 * @readonly
	 * @memberof SchoolYearFacade
	 */
	get lastYear() {
		if (this.activeYearIndex != null && this.activeYearIndex !== 0) {
			return this.schoolYears[this.activeYearIndex - 1];
		}
		const now = Date.now();
		const pastYears = this.schoolYears.filter((year) => year.endDate < now);
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
		if (givenYearIndex === -1 || this.schoolYears.length < nextYearIndex) {
			return null;
		}
		return this.schoolYears[nextYearIndex];
	}

	static extractStartYear(yearName) {
		return parseInt(yearName.substring(0, 4), 10);
	}

	static getDefaultEndDate(yearName) {
		const year = SchoolYearFacade.extractStartYear(yearName);
		return Date.UTC(year + 1, 6, 31); // 1.7.(YEAR+1)
	}

	static getDefaultStartDate(yearName) {
		const year = SchoolYearFacade.extractStartYear(yearName);
		return Date.UTC(year, 7, 1); // 1.8.YEAR
	}

	/**
	 *converts the class into a JSON Object having schoolYears and all calculated get properties
	 *
	 * @returns
	 * @memberof SchoolYearFacade
	 */
	toJSON() {
		return {
			schoolYears: this.schoolYears,
			activeYear: this.activeYear,
			defaultYear: this.defaultYear,
			nextYear: this.nextYear,
			lastYear: this.lastYear,
		};
	}
}

module.exports = SchoolYearFacade;
