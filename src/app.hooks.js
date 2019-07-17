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
                    && ['lessons', 'newsModel', 'homework', 'submissions'].includes(path);
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

module.exports = {
	before: {
		all: [],
		find: [],
		get: [],
		create: [sanitizeData, globalHooks.ifNotLocal(removeObjectIdInData)],
		update: [sanitizeData],
		patch: [sanitizeData],
		remove: [],
	},

	after: {
		all: [],
		find: [],
		get: [],
		create: [],
		update: [],
		patch: [],
		remove: [],
	},

	error: {
		all: [],
		find: [],
		get: [],
		create: [],
		update: [],
		patch: [],
		remove: [],
	},
};
