"use strict";

const hooks = require("./hooks");
// Data is currently simply taken from https://ferien-api.de/api/v1/holidays
const holidayData = require("./holidayData.json");

class HolidaysService {
	async find({ query }) {
		let result = holidayData;
		const year = query.year || null;
		result = year
			? result.filter(entry => `${entry.year}` === year)
			: result;
		const federalState = query.stateCode || null;
		result = federalState
			? result.filter(entry => entry.stateCode === federalState)
			: result;

		return result;
	}
}

module.exports = function() {
	const app = this;

	// Initialize our service with any options it requires
	app.use("/holidays", new HolidaysService());

	const holidaysService = app.service("/holidays");

	holidaysService.before(hooks.before);
	holidaysService.after(hooks.after);
};
