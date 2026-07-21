/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { AuthGuardModule } from './auth-guard.module';
export {
	JWT_AUTH_GUARD_CONFIG_TOKEN,
	JwtAuthGuardConfig,
	X_API_KEY_AUTH_GUARD_CONFIG_TOKEN,
	XApiKeyAuthGuardConfig,
} from './config';
export { CurrentUser, JWT, JwtAuthentication, WsJwtAuthentication, XApiKeyAuthentication } from './decorator';
// JwtAuthGuard only exported because api tests still overried this guard.
// Use JwtAuthentication decorator for request validation
export { JwtAuthGuard, WsJwtAuthGuard, XApiKeyGuard } from './guard';
export { AuthGuardModuleOptions, AuthGuardOptions, CreateJwtPayload, ICurrentUser, StrategyType } from './interface';
export { CurrentUserBuilder, JwtPayloadBuilder } from './mapper';
export { JwtPayloadVo } from './vo/jwt-payload.vo';
