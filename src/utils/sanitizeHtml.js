/* eslint-disable no-param-reassign */
const sanitizeHtml = require('sanitize-html');
const Entities = require('html-entities').AllHtmlEntities;

const entities = new Entities();

const maxDeep = 10;
// enable html for all current editors
const keys = ['content', 'text', 'comment', 'gradeComment', 'description'];
const paths = ['lessons', 'news', 'newsModel', 'homework', 'submissions'];
const saveKeys = ['password'];
const allowedTags = ['h1', 'h2', 'h3', 'blockquote', 'p', 'a', 'ul', 'ol', 's', 'u', 'span', 'del',
	'li', 'b', 'i', 'img', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
	'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'audio', 'video', 'iframe'];
const allowedSchemes = ['http', 'https', 'ftp', 'mailto'];

const sanitize = (data, options) => {
	// https://www.npmjs.com/package/sanitize-html
	if ((options || {}).html === true) {
		// editor-content data
		data = sanitizeHtml(data, { // TODO: set options own time
			allowedTags,
			allowedAttributes: false, // allow all attributes of allowed tags
			allowedSchemes,
			parser: {
				decodeEntities: true,
			},
		});
		data = data.replace(/(&lt;script&gt;).*?(&lt;\/script&gt;)/gim, ''); // force remove script tags
		data = data.replace(/(<script>).*?(<\/script>)/gim, ''); // force remove script tags
	} else {
		// non editor-content data
		data = sanitizeHtml(data, { // TODO: set options own time
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

const allowedHtmlByPathAndKeys = (path, key) => paths.includes(path) && keys.includes(key);

/**
 * Strips JS/HTML Code from data and returns clean version of it
 * @param data {object/array/string}
 * @returns data - clean without JS
 */
const sanitizeDeep = (data, path, depth = 0) => {
	if (depth >= maxDeep) {
		throw new Error('Data level is to deep. (sanitizeDeep)', { path, data });
	}
	if (typeof data === 'object' && data !== null) {
		// eslint-disable-next-line consistent-return
		Object.entries(data).forEach(([key, value]) => {
			if (typeof value === 'string') {
				// ignore values completely
				if (saveKeys.includes(key)) return data; // TODO:  why not over keys in allowedHtmlByPathAndKeys
				data[key] = sanitize(value, { html: allowedHtmlByPathAndKeys(path, key) });
			} else {
				sanitizeDeep(value, path, depth + 1);
			}
		});
	} else if (typeof data === 'string') {
		data = sanitize(data, { html: false });
	} else if (Array.isArray(data)) {
		for (let i = 0; i < data.length; i += 1) {
			if (typeof data[i] === 'string') {
				data[i] = sanitize(data[i], { html: false });
			} else {
				sanitizeDeep(data[i], path, depth + 1);
			}
		}
	}
	return data;
};

module.exports = {
	sanitizeDeep,
	sanitizeConsts: {
		keys,
		paths,
		saveKeys,
		allowedTags,
		allowedSchemes,
		maxDeep,
	},
};
