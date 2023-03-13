export enum SSOErrorCode {
	SSO_INVALID_STATE = 'sso_invalid_state',
	SSO_USER_NOT_FOUND = 'sso_user_notfound',
	SSO_OAUTH_ACCESS_DENIED = 'sso_oauth_access_denied',
	SSO_JWT_PROBLEM = 'sso_jwt_problem',
	SSO_OAUTH_INVALID_REQUEST = 'sso_oauth_invalid_request',
	SSO_OAUTH_UNSUPPORTED_RESPONSE_TYPE = 'sso_oauth_unsupported_response_type',
	SSO_OAUTH_LOGIN_FAILED = 'sso_login_failed',
	SSO_AUTH_CODE_STEP = 'sso_auth_code_step',
	SSO_INTERNAL_ERROR = 'sso_internal_error',
}
