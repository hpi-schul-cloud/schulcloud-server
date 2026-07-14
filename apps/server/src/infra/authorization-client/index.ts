/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { AuthorizationClientAdapter } from './authorization-client.adapter';
export {
	AUTHORIZATION_CLIENT_CONFIG_TOKEN,
	AuthorizationClientConfig,
	InternalAuthorizationClientConfig,
} from './authorization-client.config';
export { AuthorizationClientModule } from './authorization-client.module';
export {
	AuthorizationBodyParamsReferenceType,
	AuthorizationContextParamsAction,
	AuthorizationContextParamsRequiredPermissions,
} from './generated';
export { AuthorizationContextBuilder } from './mapper';
