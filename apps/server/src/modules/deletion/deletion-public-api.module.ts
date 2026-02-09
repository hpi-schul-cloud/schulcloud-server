import { LoggerModule } from '@core/logger';
import { AuthorizationModule } from '@modules/authorization';

import { Module } from '@nestjs/common';
import { DeletionModule } from '.';
import { DeletionRequestPublicController } from './api/controller/deletion-request-public.controller';
import { DeletionRequestPublicUc } from './api/uc';
import { AccountModule } from '../account';
import { UserModule } from '@modules/user';

@Module({
	imports: [LoggerModule, DeletionModule, UserModule, AccountModule, AuthorizationModule],
	controllers: [DeletionRequestPublicController],
	providers: [DeletionRequestPublicUc],
})
export class DeletionPublicApiModule {}
