import { Module } from '@nestjs/common';
import { FeathersModule } from '@shared/infra/feathers';
import { AuthorizationService } from './authorization.service';
import { FeathersAuthProvider } from './feathers-auth.provider';

@Module({
	imports: [FeathersModule],
	providers: [AuthorizationService, FeathersAuthProvider],
	exports: [AuthorizationService],
})
export class AuthorizationModule {}
