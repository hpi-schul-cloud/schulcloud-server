import { LoggerModule } from '@infra/logger';
import { AuthenticationModule } from '@modules/authentication';
import { AuthorizationModule } from '@modules/authorization';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { DeletionModule } from '.';
import { AccountModule } from '../account';
import { DeletionRequestPublicController } from './api/controller/deletion-request-public.controller';
import { DeletionRequestPublicUc } from './api/uc';

@Module({
	imports: [LoggerModule, DeletionModule, UserModule, AccountModule, AuthenticationModule, AuthorizationModule],
	controllers: [DeletionRequestPublicController],
	providers: [DeletionRequestPublicUc],
})
export class DeletionPublicApiModule {}
