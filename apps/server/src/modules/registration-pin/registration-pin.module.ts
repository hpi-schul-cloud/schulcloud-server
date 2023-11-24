import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { RegistrationPinService } from './service/registration-pin.service';
import { RegistrationPinRepo } from './repo/registration-pin.repo';

@Module({
	imports: [LoggerModule],
	providers: [RegistrationPinService, RegistrationPinRepo],
	exports: [RegistrationPinService],
})
export class RegistrationPinModule {}
