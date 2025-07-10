import { Module } from '@nestjs/common';
import { AuthorizationReferenceController, AuthorizationReferenceUc } from './api';
import { AuthorizationReferenceModule } from './authorization-reference.module';
import { AccessTokenModule } from '@infra/access-token';

@Module({
	imports: [AuthorizationReferenceModule, AccessTokenModule],
	providers: [AuthorizationReferenceUc],
	controllers: [AuthorizationReferenceController],
})
export class AuthorizationReferenceApiModule {}
