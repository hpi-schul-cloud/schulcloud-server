const { Configuration } = require('@schul-cloud/commons');
const hooks = require('./hooks/index');
const globalHooks = require('../../hooks');
const { SC_SHORT_TITLE } = require('../../../config/globals');

class StatisticMailService {
	constructor(app) {
		this.app = app;
	}

	create() {
		return this.app.service('statistics').find().then((statData) => {
			let htmlMailContent = `<h1>Statistik für ${SC_SHORT_TITLE}</h1>`;
			htmlMailContent += `<table><tr><td>Schulen</td><td>${statData.schools}</td></tr>`;
			htmlMailContent += `<tr><td>SchülerInnen</td><td>${statData.students}</td></tr>`;
			htmlMailContent += `<tr><td>Lehrkräfte</td><td>${statData.teachers}</td></tr>`;
			htmlMailContent += `<tr><td>Aufgaben</td><td>${statData.homework}</td></tr>`;
			htmlMailContent += `<tr><td>Abgaben</td><td>${statData.submissions}</td></tr>`;
			htmlMailContent += `<tr><td>Kurse</td><td>${statData.courses}/td></tr>`;
			htmlMailContent += '</table>';
			const mailService = this.app.service('mails');

			if (Configuration.has('ADMIN_MAIL_RECEIVERS')) {
				mailService.create({
					email: Configuration.get('ADMIN_MAIL_RECEIVERS'),
					subject: `Statistik für ${SC_SHORT_TITLE}`,
					content: {
						html: htmlMailContent,
					},
				});
				return 'Mail sent';
			}
			return 'ADMIN_MAIL_RECEIVERS not set';

		});
	}
}
// eslint-disable-next-line func-names
module.exports = function (app) {
	app.use('/statistics/mails', new StatisticMailService(app));
	const statisticsMailService = app.service('/statistics/mails');
	statisticsMailService.hooks(hooks);
};
