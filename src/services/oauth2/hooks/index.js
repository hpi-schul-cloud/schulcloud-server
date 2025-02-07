/* eslint-disable promise/no-nesting */
const { MethodNotAllowed } = require('../../../errors');
const globalHooks = require('../../../hooks');

const properties = 'title="username" style="height: 26px; width: 180px; border: none;"';
const iframeSubject = (pseudonym, url) => `<iframe src="${url}/oauth2/username/${pseudonym}" ${properties}></iframe>`;

exports.getSubject = iframeSubject;

exports.hooks = {
	introspect: {
		before: {
			create: [
				globalHooks.ifNotLocal(() => {
					throw new MethodNotAllowed();
				}),
			],
		},
	},
};
