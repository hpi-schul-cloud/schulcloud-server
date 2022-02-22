import { Module } from '@nestjs/common';
import { FeathersModule } from '@shared/infra/feathers';
import { AuthorizationService } from './authorization.service';
import { FeathersAuthProvider } from './feathers-auth.provider';
import { FeathersJwtProvider } from './feathers-jwt.provider';

@Module({
	imports: [FeathersModule],
	providers: [AuthorizationService, FeathersAuthProvider, FeathersJwtProvider],
	exports: [AuthorizationService, FeathersJwtProvider],
})
export class AuthorizationModule {}
