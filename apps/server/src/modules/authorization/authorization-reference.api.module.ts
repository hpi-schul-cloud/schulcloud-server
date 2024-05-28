import { Module } from '@nestjs/common';
import { AuthorizationReferenceUc, AuthorizationReferenceController } from './api';
import { AuthorizationReferenceModule } from './authorization-reference.module';

@Module({
	imports: [AuthorizationReferenceModule],
	providers: [AuthorizationReferenceUc],
	controllers: [AuthorizationReferenceController],
})
export class AuthorizationReferenceApiModule {}
