/* eslint-disable no-param-reassign */
const sanitizeHtml = require('sanitize-html');

const maxDeep = 12;
// enable html for all current editors
const keys = ['content', 'text', 'comment', 'gradeComment', 'description'];
const paths = ['lessons', 'news', 'newsModel', 'homework', 'submissions'];
const saveKeys = ['password', 'secret'];
const allowedTags = ['h1', 'h2', 'h3', 'blockquote', 'p', 'a', 'ul', 'ol', 's', 'u', 'span', 'del',
	'li', 'b', 'i', 'img', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
	'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'audio', 'video', 'sub', 'sup'];
const allowedSchemes = ['http', 'https', 'ftp', 'mailto'];

// const allowedSchemesByTag = {
// 	// allow base64 image data
// 	img: ['data'],
// };

const MEDIA_ATTRIBUTES = ['src', 'width', 'height', 'alt', 'style'];
const allowedAttributes = {
	'*': ['class'],
	a: ['href', 'name', 'target'],
	img: MEDIA_ATTRIBUTES,
	video: [...MEDIA_ATTRIBUTES, 'autoplay', 'name', 'controls', 'controlslist'],
	audio: [...MEDIA_ATTRIBUTES, 'controls', 'controlslist'],
	span: ['style'],
};

const COLOR_REGEX = [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/];
// Match any number with px, em, or %
const SIZE_REGEX = [/^\d+(?:px|em|%)$/];

const htmlTrueOptions = {
	allowedTags,
	allowedAttributes, // allow all attributes of allowed tags
	allowedSchemes,
	// allowedSchemesByTag, // TODO enable this?
	parser: {
		decodeEntities: true,
	},
	allowedStyles: {
		'*': {
			// Match HEX and RGB
			color: COLOR_REGEX,
			'background-color': COLOR_REGEX,
			'text-align': [/^left$/, /^right$/, /^center$/],
			'font-size': SIZE_REGEX,
			height: SIZE_REGEX,
			width: SIZE_REGEX,
			'font-style': [/^\w+$/],
		},
	},
};

const htmlFalseOptions = {
	allowedTags: [], // disallow all tags
	allowedAttributes: [], // disallow all attributes
	allowedSchemes: [], // disallow url schemes
	parser: {
		decodeEntities: true,
	},
};

/**
 * sanitizes data
 * @param {*} data
 * @param {*} param
 */
const sanitize = (data, { html = false }) => {
	let retValue = null;
	// https://www.npmjs.com/package/sanitize-html
	if (html === true) {
		// editor-content data
		retValue = sanitizeHtml(data, htmlTrueOptions);
		// TODO handle following lines in sanitizeHtml
		retValue = retValue.replace(/(&lt;script&gt;).*?(&lt;\/script&gt;)/gim, ''); // force remove script tags
		retValue = retValue.replace(/(<script>).*?(<\/script>)/gim, ''); // force remove script tags
	} else {
		// non editor-content data
		retValue = sanitizeHtml(data, htmlFalseOptions);
	}
	return retValue;
};

/**
 * disables sanitization for defined keys if a path is matching
 * @param {*} path
 * @param {*} key
 */
const allowedHtmlByPathAndKeys = (path, key) => paths.includes(path) && keys.includes(key);

/**
 * Strips JS/HTML Code from data and returns clean version of it
 * @param data {object/array/string}
 * @param path {string}
 * @param depth {number} -
 * @param safeAttributes {array} - attributes over which sanitization won't be performed
 * @returns data - clean without JS
 */
const sanitizeDeep = (data, path, depth = 0, safeAttributes = []) => {
	if (depth >= maxDeep) {
		throw new Error('Data level is to deep. (sanitizeDeep)', { path, data });
	}
	if (typeof data === 'object' && data !== null) {
		// we have an object, can match strings or recurse child objects
		// eslint-disable-next-line consistent-return
		Object.entries(data).forEach(([key, value]) => {
			if (typeof value === 'string') {
				// ignore values completely
				if (saveKeys.includes(key) || safeAttributes.includes(key)) {
					return data; // TODO:  why not over keys in allowedHtmlByPathAndKeys
				}
				data[key] = sanitize(value, { html: allowedHtmlByPathAndKeys(path, key) });
			} else {
				sanitizeDeep(value, path, depth + 1, safeAttributes);
			}
		});
	} else if (typeof data === 'string') {
		// here we can sanitize the input
		data = sanitize(data, { html: false });
	} else if (Array.isArray(data)) {
		// here we have to check all array elements and sanitize strings or do recursion
		for (let i = 0; i < data.length; i += 1) {
			if (typeof data[i] === 'string') {
				data[i] = sanitize(data[i], { html: false });
			} else {
				sanitizeDeep(data[i], path, depth + 1, safeAttributes);
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
