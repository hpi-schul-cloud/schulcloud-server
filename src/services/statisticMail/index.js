const { Configuration } = require('@hpi-schul-cloud/commons');
const hooks = require('./hooks/index');

class StatisticMailService {
	constructor(app) {
		this.app = app;
	}

	async create() {
		try {
			const SC_SHORT_TITLE = Configuration.get('SC_SHORT_TITLE');
			const statData = await this.app.service('statistics').find();
			let htmlMailContent = `<h1>Statistik für ${SC_SHORT_TITLE}</h1>`;
			htmlMailContent += `<table><tr><td>Schulen</td><td>${statData.schools}</td></tr>`;
			htmlMailContent += `<tr><td>SchülerInnen</td><td>${statData.students}</td></tr>`;
			htmlMailContent += `<tr><td>Lehrkräfte</td><td>${statData.teachers}</td></tr>`;
			htmlMailContent += `<tr><td>Aufgaben</td><td>${statData.homework}</td></tr>`;
			htmlMailContent += `<tr><td>Abgaben</td><td>${statData.submissions}</td></tr>`;
			htmlMailContent += `<tr><td>Kurse</td><td>${statData.courses}</td></tr>`;
			htmlMailContent += '</table>';

			if (!Configuration.has('ADMIN_MAIL_RECEIVERS')) {
				throw new Error('ADMIN_MAIL_RECEIVERS not set');
			}
			if (!Configuration.get('ADMIN_MAIL_RECEIVERS')) {
				throw new Error('ADMIN_MAIL_RECEIVERS is empty');
			}
			await this.app.service('mails').create({
				email: Configuration.get('ADMIN_MAIL_RECEIVERS'),
				subject: `Statistik für ${SC_SHORT_TITLE}`,
				content: {
					html: htmlMailContent,
				},
			});
			return { success: true, message: 'Mail sent' };
		} catch (error) {
			throw new Error(error.message || 'Email could not be sent');
		}
	}
}
// eslint-disable-next-line func-names
module.exports = function (app) {
	app.use('/statisticmails', new StatisticMailService(app));
	const statisticsMailService = app.service('/statisticmails');
	statisticsMailService.hooks(hooks);
};
