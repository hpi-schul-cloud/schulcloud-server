/* eslint-disable no-param-reassign */
// Global hooks that run for every service
const sanitizeHtml = require('sanitize-html');
const Entities = require('html-entities').AllHtmlEntities;

const entities = new Entities();

const globalHooks = require('./hooks/');

const sanitize = (data, options) => {
	// https://www.npmjs.com/package/sanitize-html
	if ((options || {}).html === true) {
		// editor-content data
		data = sanitizeHtml(data, {
			allowedTags: ['h1', 'h2', 'h3', 'blockquote', 'p', 'a', 'ul', 'ol', 's', 'u', 'span', 'del',
				'li', 'b', 'i', 'img', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
				'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'audio', 'video', 'iframe'],
			allowedAttributes: false, // allow all attributes of allowed tags
			allowedSchemes: ['http', 'https', 'ftp', 'mailto'],
			parser: {
				decodeEntities: true,
			},
		});
		data = data.replace(/(&lt;script&gt;).*?(&lt;\/script&gt;)/gim, ''); // force remove script tags
		data = data.replace(/(<script>).*?(<\/script>)/gim, ''); // force remove script tags
	} else {
		// non editor-content data
		data = sanitizeHtml(data, {
			allowedTags: [], // disallow all tags
			allowedAttributes: [], // disallow all attributes
			allowedSchemes: [], // disallow url schemes
			parser: {
				decodeEntities: true,
			},
		});
	}
	// something during sanitizeHtml() is encoding HTML Entities like & => &amp;
	// I wasn't able to figure out which option disables this so I just decode it again.
	// BTW: html-entities is already a dependency of sanitize-html so no new imports where done here.
	return entities.decode(data);
};

/**
 * Strips JS/HTML Code from data and returns clean version of it
 * @param data {object/array/string}
 * @returns data - clean without JS
 */
const sanitizeDeep = (data, path) => {
	if (typeof data === 'object' && data !== null) {
		Object.entries(data).forEach(([key, value]) => {
			if (typeof value === 'string') {
				// ignore values completely
				if (['password'].includes(key)) return data;
				// enable html for all current editors
				const needsHtml = ['content', 'text', 'comment', 'gradeComment', 'description'].includes(key)
                    && ['lessons', 'news', 'newsModel', 'homework', 'submissions'].includes(path);
				data[key] = sanitize(value, { html: needsHtml });
			} else {
				sanitizeDeep(value, path);
			}
		});
	} else if (typeof data === 'string') {
		data = sanitize(data, { html: false });
	} else if (Array.isArray(data)) {
		for (let i = 0; i < data.length; i += 1) {
			if (typeof data[i] === 'string') {
				data[i] = sanitize(data[i], { html: false });
			} else {
				sanitizeDeep(data[i], path);
			}
		}
	}
	return data;
};

const sanitizeData = (context) => {
	if (context.data && context.path && context.path !== 'authentication') {
		sanitizeDeep(context.data, context.path);
	}
	return context;
};

const removeObjectIdInData = (context) => {
	if (context.data && context.data._id) {
		delete context.data._id;
	}
	return context;
};

const displayInternRequests = (level) => (context) => {
	if (context.params.provider === 'rest') {
		return context;
	}
	const {
		id, params, path, data, method,
	} = context;

	if (['accounts'].includes(path) && level < 4) {
		return context;
	}
	const out = {
		path,
		method,
	};
	if (id) { out.id = id; }
	Object.keys(params).forEach((key) => {
		if (params.key) { out[key] = params.key; }
	});
	if (data) { out.data = data; }

	// eslint-disable-next-line no-console
	console.log('[intern]');
	// eslint-disable-next-line no-console
	console.log(out);
	// eslint-disable-next-line no-console
	console.log(' ');

	return context;
};

module.exports = function setup(app) {
	const before = {
		all: [],
		find: [],
		get: [],
		create: [sanitizeData, globalHooks.ifNotLocal(removeObjectIdInData)],
		update: [sanitizeData],
		patch: [sanitizeData],
		remove: [],
	};

	const after = {
		all: [],
		find: [],
		get: [],
		create: [],
		update: [],
		patch: [],
		remove: [],
	};

	const error = {
		all: [],
		find: [],
		get: [],
		create: [],
		update: [],
		patch: [],
		remove: [],
	};

	// DISPLAY_REQUEST_LEVEL is set by requestLogger middleware in production it is force to 0
	// level 2+ adding intern request
	if (app.get('DISPLAY_REQUEST_LEVEL') > 1) {
		before.all.unshift(displayInternRequests(app.get('DISPLAY_REQUEST_LEVEL')));
	}
	app.hooks({ before, after, error });
};
