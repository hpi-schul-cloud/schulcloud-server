import { LoggerModule } from '@infra/logger';
import { Module } from '@nestjs/common';
import { RegistrationPinRepo } from './repo';
import { RegistrationPinService } from './service';

@Module({
	imports: [LoggerModule],
	providers: [RegistrationPinService, RegistrationPinRepo],
	exports: [RegistrationPinService],
})
export class RegistrationPinModule {}
