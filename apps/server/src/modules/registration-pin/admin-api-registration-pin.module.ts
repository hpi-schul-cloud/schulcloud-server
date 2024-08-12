import { Module } from '@nestjs/common';
import { AdminApiRegistrationPinController, RegistrationPinUc } from './api';
import { RegistrationPinModule } from './registration-pin.module';

@Module({
	imports: [RegistrationPinModule],
	controllers: [AdminApiRegistrationPinController],
	providers: [RegistrationPinUc],
})
export class AdminApiRegistrationPinModule {}
