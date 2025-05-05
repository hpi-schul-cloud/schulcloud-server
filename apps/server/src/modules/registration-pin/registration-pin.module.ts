import { Module } from '@nestjs/common';
import { LoggerModule } from '@core/logger';
import { RegistrationPinService } from './service';
import { RegistrationPinRepo } from './repo';
import { UserModule } from '@modules/user';

@Module({
	imports: [LoggerModule, UserModule],
	providers: [RegistrationPinService, RegistrationPinRepo],
	exports: [RegistrationPinService],
})
export class RegistrationPinModule {}
