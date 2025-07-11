import { AccessTokenModule } from '@infra/access-token';
import { AuthGuardModule } from '@infra/auth-guard';
import { Module } from '@nestjs/common';
import { AuthorizationReferenceController, AuthorizationReferenceUc } from './api';
import { AuthorizationReferenceModule } from './authorization-reference.module';

@Module({
	imports: [AuthorizationReferenceModule, AccessTokenModule, AuthGuardModule.register([])],
	providers: [AuthorizationReferenceUc],
	controllers: [AuthorizationReferenceController],
})
export class AuthorizationReferenceApiModule {}
