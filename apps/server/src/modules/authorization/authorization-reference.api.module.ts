import { Module } from '@nestjs/common';
import { AuthorizationReferenceUc } from './api/authorization-reference.uc';
import { AuthorizationReferenceModule } from './authorization-reference.module';
import { AuthorizationReferenceController } from './api/authorization-reference.controller';

@Module({
	imports: [AuthorizationReferenceModule],
	providers: [AuthorizationReferenceUc],
	controllers: [AuthorizationReferenceController],
})
export class AuthorizationReferenceApiModule {}
