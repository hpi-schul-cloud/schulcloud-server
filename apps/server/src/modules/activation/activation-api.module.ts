import { Module } from '@nestjs/common';
import { AuthorizationModule } from '@modules/authorization';
import { ActivationModule } from './index';
import { EmailActivationController } from './controller';
import { EmailActivationUc } from './uc';

@Module({
	imports: [ActivationModule, AuthorizationModule],
	controllers: [EmailActivationController],
	providers: [EmailActivationUc],
})
export class ActivationApiModule {}
