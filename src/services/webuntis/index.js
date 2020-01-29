// const { modelService, modelServiceHooks } = require('./services/modelService');

/* In addition to setting up the service code, the service has to be included in src/index.js. */

class WebuntisCourseMetadata {
	constructor(options) {
		this.options = options || {};
	}

	registerEventListeners() {

	}

	setup(app) {
		this.app = app;
		this.registerEventListeners();
	}

	async find(params) {
		const result = {
			total: 4,
			skip: 0,
			limit: 25,
			data: [
				{
					_id: '99997c385b94c21cc80e88d5',
					datasourceRunId: '95997c385b94c21cc80e88d5',
					teacher: 'Renz',
					class: '7a',
					subject: 'Deutsch',
					room: 'E-51',
				},
				{
					_id: '99997c385b94c21cc80e88d6',
					datasourceRunId: '95997c385b94c21cc80e88d5',
					teacher: 'Kremer',
					class: '7b',
					subject: 'Deutsch',
					room: 'E-51',
				},
				{
					_id: '99997c385b94c21cc80e88d7',
					datasourceRunId: '95997c385b94c21cc80e88d5',
					teacher: 'Sommer',
					class: '8b',
					subject: 'Englisch',
					room: '1-32',
				},
				{
					_id: '99997c385b94c21cc80e88d8',
					datasourceRunId: '95997c385b94c21cc80e88d5',
					teacher: 'Thorns',
					class: '8c',
					subject: 'Englisch',
					room: '1-32',
				},
			],
		};
		return result;
	}
}

module.exports = (app) => {
	app.use('/webuntisCourseMetadata', new WebuntisCourseMetadata({
		paginate: {
			default: 25,
			max: 100,
		},
	}));

	// const serviceTemplate = app.service('/modelTemplate');
	// serviceTemplate.hooks(modelServiceHooks);
};
