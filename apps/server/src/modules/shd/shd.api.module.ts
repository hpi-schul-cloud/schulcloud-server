import { AuthorizationModule } from '@modules/authorization/authorization.module';
import { Module } from '@nestjs/common';
import { AuthenticationModule } from '@modules/authentication';
import { AuthGuardModule } from '@infra/auth-guard';
import { ShdController, ShdUc } from './api';

@Module({
	imports: [AuthorizationModule, AuthenticationModule, AuthGuardModule],
	controllers: [ShdController],
	providers: [ShdUc],
})
export class ShdApiModule {}
