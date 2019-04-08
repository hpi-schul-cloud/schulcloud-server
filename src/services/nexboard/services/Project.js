/* eslint-disable object-curly-newline */
/* eslint-disable class-methods-use-this */
const rpn = require('request-promise-native');
const EDITOR_MS_URI = process.env.EDITOR_MS_URI || 'http://localhost:4001';
const REQUEST_TIMEOUT = process.env.NODE_ENV !== 'production' ? 120 * 1000 : 6 * 1000;
const nexboardClient = require('../Nexboard')

class Project {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	async get(id, params) { // id equals lessonId
		let nexboardSectionAttachments
		nexboardSectionAttachments = await rpn({
			uri: `${EDITOR_MS_URI}/sections/attachments`,
			method: 'GET',
			headers: {
				// Authorization: userId, // TODO
			},
			qs: {
				lesson: id
			},
			json: true,
			timeout: REQUEST_TIMEOUT,
		})

		if (nexboardSectionAttachments.total !== 0) {
			return nexboardClient.getProject(nexboardSectionAttachments.data[0].value)
		}

		const nexboardProject = (await this.create({ lessonId: id }, params)).project

		return nexboardProject
	}

	find(params) {
		return nexboardClient.getProjectsIds()
	}

	async create({ lessonId, title = 'Neues Nexboard Projekt', description = "Hier werden alle Nexboards für diese Lerneinheit gesammelt" }, params) {
		const project = await nexboardClient.createProject(title, description)

		const nexboardSectionAttachment = await rpn({
			uri: `${EDITOR_MS_URI}/sections/attachments`,
			method: 'POST',
			headers: {
				// Authorization: userId, // TODO
			},
			body: {
				lesson: lessonId,
				key: 'nexboard',
				value: project.id
			},
			json: true,
			timeout: REQUEST_TIMEOUT,
		})

		return { project, lessonId, attachment: nexboardSectionAttachment }
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = Project;
