'use strict';
const globalHooks = require('../../hooks');
const auth = require('feathers-authentication');
const TopicTemplateModel = require('../topicTemplate/model');

const enrichWithParentTemplateData = async context => {
	const dataArray = Array.isArray(context.data)
		? context.data
		: [context.data];
	const augmentedData = await Promise.all(
		dataArray.map(async data => {
			const { parentTemplateId } = data;
			if (!parentTemplateId) throw new Error('No parentTemplateId given');
			const parentTemplate = await TopicTemplateModel.findById(
				parentTemplateId
			).exec();
			return {
				name: parentTemplate.name,
				numberOfWeeks: parentTemplate.numberOfWeeks,
				unitsPerWeek: parentTemplate.unitsPerWeek,
				content: parentTemplate.content,
				lectureUnits: parentTemplate.lectureUnits,
				examinations: parentTemplate.examinations,
				material: parentTemplate.material,
				...data
			};
		})
	);
	context.data = augmentedData;

	return context;
};

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [globalHooks.hasPermission('TOPIC_TEMPLATE_VIEW')],
	get: [globalHooks.hasPermission('TOPIC_TEMPLATE_VIEW')],
	create: [
		globalHooks.hasPermission('TOPIC_TEMPLATE_EDIT'),
		globalHooks.injectUserId,
		enrichWithParentTemplateData
	],
	update: [globalHooks.hasPermission('TOPIC_TEMPLATE_EDIT')],
	patch: [globalHooks.hasPermission('TOPIC_TEMPLATE_EDIT')],
	remove: [globalHooks.hasPermission('TOPIC_TEMPLATE_EDIT')]
};

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: []
};
