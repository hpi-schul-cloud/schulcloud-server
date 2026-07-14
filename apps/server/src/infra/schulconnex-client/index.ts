/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export {
	lernperiodeFormat,
	SchulconnexCommunicationType,
	SchulconnexErreichbarkeitenResponse,
	SchulconnexGroupRole,
	SchulconnexGroupType,
	SchulconnexGruppenResponse,
	SchulconnexLaufzeitResponse,
	SchulconnexPersonenkontextResponse,
	SchulconnexPoliciesInfoErrorResponse,
	SchulconnexPoliciesInfoLicenseResponse,
	SchulconnexPoliciesInfoResponse,
	SchulconnexResponse,
	SchulconnexResponseValidationGroups,
	SchulconnexRole,
	SchulconnexSonstigeGruppenzugehoerigeResponse,
} from './response';
export { SCHULCONNEX_CLIENT_CONFIG_TOKEN, SchulconnexClientConfig } from './schulconnex-client.config';
export { SchulconnexClientModule } from './schulconnex-client.module';
export { SchulconnexRestClient } from './schulconnex-rest-client';
export {
	schulconnexPoliciesInfoErrorResponseFactory,
	schulconnexPoliciesInfoLicenseResponseFactory,
	schulconnexPoliciesInfoResponseFactory,
	schulconnexResponseFactory,
} from './testing';
