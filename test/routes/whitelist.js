/* eslint-disable key-spacing, quote-props */

const whitelistNoJwt = {
	'accounts/confirm':        		{ post: 201 },
	'alert':                   		{ get:  200 },
	'gradeLevels':             		{ get:  200 },
	'lessons/contents/{type}': 		{ get:  200 },
	'passwordRecovery':        		{ post: 400 },
	'passwordRecovery/reset':		{ post: 400 },
	'oauth2/baseUrl':          		{ get:  200 },
	'registrationlink':        		{ post: 201 },
	'roster':                  		{ get:  200 },
	'schools':                 		{ get:  200 },
	'tools/link':					{ post: 404 },
	'years':                   		{ get:  200 },
	'roles':				   		{ get:  200 },
	'roles/{roleName}/permissions': { get:  200 },
	'roles/user':					{ get:  404 },
};

const whitelistInvalidJwt = {
	...whitelistNoJwt,
	'schools':     { get: 401 },
	'years':       { get: 401 },
	'gradeLevels': { get: 401 },
	'roles/{roleName}/permissions': { get: 200 },
	'roles/user':  { get: 404 },
};

// TODO create issues and list here
const ignorelistNoJwt = {
	'expertinvitelink':             ['post'],
	'users':                        ['post'],
	'accounts':                     ['get', 'post'],
	'wopi/files/{fileId}/contents': ['get', 'post'],
	'wopi/files/{fileId}':          ['get', 'post'],
	'roster/users/{user}/metadata': ['get'],
	'roster/users/{user}/groups':   ['get'],
	'link':                         ['get'],
	'consents':                     ['post'],
	'hash':                         ['post'],
	'registration':                 ['post'],
	'registrationPins':             ['post'],
};

const ignorelistInvalidJwt = {
	...ignorelistNoJwt,
};

module.exports = {
	whitelistNoJwt,
	whitelistInvalidJwt,
	ignorelistNoJwt,
	ignorelistInvalidJwt,
};
