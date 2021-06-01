import { Module } from '@nestjs/common';
import { FeathersModule } from '../feathers/feathers.module';
import { AuthorizationService } from './authorization.service';
import { FeathersAuthProvider } from './feathers-auth.provider';

@Module({
	imports: [FeathersModule],
	providers: [AuthorizationService, FeathersAuthProvider],
	exports: [AuthorizationService],
})
export class AuthorizationModule {}
