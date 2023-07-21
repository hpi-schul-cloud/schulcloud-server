import { forwardRef, Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@src/modules/authorization';
import { ContextExternalToolService, ContextExternalToolValidationService } from './service';
import { CommonToolModule } from '../common';

@Module({
	imports: [CommonToolModule, LoggerModule, forwardRef(() => AuthorizationModule)],
	providers: [ContextExternalToolService, ContextExternalToolValidationService],
	exports: [ContextExternalToolService, ContextExternalToolValidationService],
})
export class ContextExternalToolModule {}
