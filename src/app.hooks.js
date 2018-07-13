// Global hooks that run for every service
const sanitizeHtml = require('sanitize-html');


const sanitize = (data, options) => {
	// https://www.npmjs.com/package/sanitize-html
	if ((options||{}).html === true) {
		// editor-content data
		data = sanitizeHtml(data, {
			allowedTags: [ 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol', 's', 'u', 'span',
				'nl', 'li', 'b', 'i', 'img', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
				'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'audio', 'video' ],
			allowedAttributes: false, // allow all attributes of allowed tags
			allowedSchemes: [ 'http', 'https', 'ftp', 'mailto' ],
			parser: {
				decodeEntities: true
			}
		});
		data = data.replace(/(&lt;script&gt;).*(&lt;\/script&gt;)/i, ''); // force remove escaped script tags
	} else {
		// non editor-content data
		data = sanitizeHtml(data, {
			allowedTags: [], // disallow all tags
			allowedAttributes: [], // disallow all attributes
			allowedSchemes: [], // disallow url schemes
			parser: {
				decodeEntities: true
			}
		});
	}
	return data;
};

/**
 * Strips JS/HTML Code from data and returns clean version of it
 * @param data {object/array/string}
 * @returns data - clean without JS
 */
const sanitizeDeep = (data) => {
	if (typeof data === "object" && data !== null) {
		Object.entries(data).forEach(([key, value]) => {
			if(typeof value === "string" && key === "content") // editor content, html allowed
				data[key] = sanitize(value, {html:true});
			else if(typeof value === "string")
				data[key] = sanitize(value, {html:false});
			else
				sanitizeDeep(value);
		});
	} else if (typeof data === "string")
		data = sanitize(data, {html:false});
	else if (Array.isArray(data)) {
		for (let i = 0; i < data.length; i++) {
			if (typeof data[i] === "string")
				data[i] = sanitize(data[i], {html:false});
			else
				sanitizeDeep(data[i]);
		}
	}
	return data;
};

const stripJsUniversal = (hook) => {
	if (hook.data && hook.path && hook.path !== "authentication") {
		sanitizeDeep(hook.data);
	}
	return hook;
};

module.exports = {
	before: {
		all: [],
		find: [],
		get: [],
		create: [stripJsUniversal],
		update: [stripJsUniversal],
		patch: [stripJsUniversal],
		remove: []
	},
	
	after: {
		all: [],
		find: [],
		get: [],
		create: [],
		update: [],
		patch: [],
		remove: []
	}
};
