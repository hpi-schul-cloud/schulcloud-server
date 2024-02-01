import { Module } from '@nestjs/common';
import { EmailActivationService } from '@modules/activation/service/email-activation.service';
import { ActivationRepo } from '@modules/activation/repo';

@Module({
	providers: [EmailActivationService, ActivationRepo],
	exports: [EmailActivationService],
})
export class ActivationModule {}
