import { AuthGuardModule } from '@infra/auth-guard';
import { AuthenticationModule } from '@modules/authentication';
import { AuthorizationModule } from '@modules/authorization/authorization.module';
import { InstanceModule } from '@modules/instance';
import { Module } from '@nestjs/common';
import { ShdController, ShdUc } from './api';

@Module({
	imports: [AuthorizationModule, AuthenticationModule, AuthGuardModule, InstanceModule],
	controllers: [ShdController],
	providers: [ShdUc],
})
export class ShdApiModule {}
