import { LoggerModule } from '@core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { Module } from '@nestjs/common';
import { BoardModule } from '../../board';
import { ContextExternalToolModule } from '../context-external-tool';
import { ExternalToolModule } from '../external-tool';
import { SchoolExternalToolModule } from '../school-external-tool';
import { ExternalToolUtilizationService } from './service';

@Module({
	imports: [
		LoggerModule,
		ExternalToolModule,
		SchoolExternalToolModule,
		ContextExternalToolModule,
		AuthorizationModule,
		BoardModule,
	],
	providers: [ExternalToolUtilizationService],
	exports: [ExternalToolUtilizationService],
})
export class ExternalToolUtilizationModule {}
