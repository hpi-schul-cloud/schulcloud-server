export { AuthorizationModule } from './authorization.module';
export { AuthorizationConfig } from './authorization.config';
export {
	// Action should not be exported, but hard to solve for now. The AuthorizationContextBuilder is the prefared way
	Action,
	AuthorizableReferenceType,
	AuthorizationContext,
	AuthorizationContextBuilder,
	AuthorizationHelper,
	AuthorizationLoaderService,
	AuthorizationLoaderServiceGeneric,
	AuthorizationReferenceService,
	AuthorizationService,
	ForbiddenLoggableException,
	AuthorizationInjectionService,
	Rule,
	// For the use in feathers
	SystemRule,
} from './domain';
// Should not used anymore
export { FeathersAuthorizationService } from './feathers';
