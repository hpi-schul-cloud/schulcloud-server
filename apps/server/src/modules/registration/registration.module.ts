import { Module } from '@nestjs/common';
import { RegistrationService } from './domain';
import { RegistrationRepo } from './repo';
import { ServerMailModule } from '@modules/serverDynamicModuleWrappers/server-mail.module';

@Module({
	imports: [ServerMailModule],
	providers: [RegistrationRepo, RegistrationService],
	exports: [RegistrationService],
})
export class RegistrationModule {}
