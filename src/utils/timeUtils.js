const moment = require('moment-timezone');
const { Configuration } = require('@schul-cloud/commons');

const getServerTimeZone = () => {
	return Configuration.get('SC_TIME_ZONE') || 'Europe/Berlin';
};

const toServerTime = (time, customTimezone) => {
	const customTimeMoment = moment.tz(time, customTimezone);
	return customTimeMoment.tz(getServerTimeZone()).format();
};

const toCustomTime = (time, customTimezone) => {
	const serverTimeMoment = moment.tz(time, getServerTimeZone());
	return serverTimeMoment.tz(customTimezone).format();
};

module.exports = {
	toServerTime,
	toCustomTime,
};
