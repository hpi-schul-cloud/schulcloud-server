const whitelistNoJwt = {
	'accounts/confirm':        { post: 201 },
	'alert':                   { get:  200 },
	'consents':                { post: 400 },
	'consentVersions':         { get:  200 },
	'gradeLevels':             { get:  200 },
	'hash':                    { post: 400 },
	'lessons/contents/{type}': { get:  200 },
	'link':                    { get:  500 },
	'passwordRecovery':        { post: 201 },
	'passwordRecovery/reset':  { post: 201 },
	'oauth2/baseUrl':          { get:  200 },
	'registration':            { post: 400 },
	'registrationlink':        { post: 201 },
	'registrationPins':        { post: 400 },
	'roster':                  { get:  200 },
	'schools':                 { get:  200 },
	'tools/link':              { post: 404 },
	'years':                   { get:  200 },
};

const whitelistInvalidJwt = {
	...whitelistNoJwt,
	'schools':     { get: 401 },
	'years':       { get: 401 },
	'gradeLevels': { get: 401 },
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
};

const ignorelistInvalidJwt = {
	...ignorelistNoJwt,
};

module.exports = { whitelistNoJwt, whitelistInvalidJwt, ignorelistNoJwt, ignorelistInvalidJwt };
