import { AuthenticationModule } from '@modules/authentication';
import { AuthorizationModule } from '@modules/authorization/authorization.module';
import { Module } from '@nestjs/common';
import { ShdController, ShdUc } from './api';

@Module({
	imports: [AuthorizationModule, AuthenticationModule],
	controllers: [ShdController],
	providers: [ShdUc],
})
export class ShdApiModule {}
