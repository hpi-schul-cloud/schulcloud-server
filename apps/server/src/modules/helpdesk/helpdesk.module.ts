import { Module } from '@nestjs/common';
import { HelpdeskProblemService } from './domain';
import { ServerMailModule } from '@modules/serverDynamicModuleWrappers/server-mail.module';

@Module({
	imports: [ServerMailModule],
	providers: [HelpdeskProblemService],
	exports: [HelpdeskProblemService],
})
export class HelpdeskModule {}
