const { toCustomTime, toServerTime } = require('../../src/utils/timeUtils');

describe('Test timezone convertion', () => {
	it('from server to custom', () => {
		const time = '2017-08-27T22:00:00.000Z';
		const customTime = toCustomTime(time, 'America/Toronto');
		console.log(customTime);
	});

	it('from custom to server', () => {
		const time = '2017-08-27T22:00:00.000Z';
		const serverTime = toServerTime(time, 'America/Toronto');
		console.log(serverTime);
	});
});
