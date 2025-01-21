import { Module } from '@nestjs/common';
import { LoggerModule } from '@core/logger';
import { RegistrationPinService } from './service';
import { RegistrationPinRepo } from './repo';

@Module({
	imports: [LoggerModule],
	providers: [RegistrationPinService, RegistrationPinRepo],
	exports: [RegistrationPinService],
})
export class RegistrationPinModule {}
