import { Module } from '@nestjs/common';
import { FeathersModule } from '@shared/infra/feathers';
import { FeathersAuthProvider } from './feathers-auth.provider';
import { FeathersAuthorizationService } from './feathers-authorization.service';
import { FeathersJwtProvider } from './feathers-jwt.provider';

@Module({
	imports: [FeathersModule],
	providers: [FeathersAuthorizationService, FeathersAuthProvider, FeathersJwtProvider],
	exports: [FeathersAuthorizationService, FeathersJwtProvider],
})
export class AuthorizationModule {}
