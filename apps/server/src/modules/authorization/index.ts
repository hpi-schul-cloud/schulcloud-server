/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { AuthorizationModule } from './authorization.module';
export {
	// Action should not be exported, but hard to solve for now. The AuthorizationContextBuilder is the prefared way
	Action,
	AuthorizableReferenceType,
	AuthorizationContext,
	AuthorizationContextBuilder,
	AuthorizationHelper,
	AuthorizationInjectionService,
	AuthorizationLoaderService,
	AuthorizationLoaderServiceGeneric,
	AuthorizationService,
	ForbiddenLoggableException,
	Rule,
	type CurrentUserLoader,
} from './domain';
// Should not used anymore
export {
	AUTHORIZATION_CONFIG_TOKEN,
	AuthorizationConfig,
	TeacherVisibilityForExternalTeamInvitation,
} from './authorization.config';
export { FeathersAuthorizationService } from './feathers';
