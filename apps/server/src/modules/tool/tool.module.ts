import { forwardRef, Module } from '@nestjs/common';
import { CommonToolModule } from './common';
import { CommonToolService } from './common/service';
import { ContextExternalToolModule } from './context-external-tool';
import { ExternalToolModule } from './external-tool';
import { SchoolExternalToolModule } from './school-external-tool';
import { ToolLaunchModule } from './tool-launch';

@Module({
	imports: [
		forwardRef(() => CommonToolModule),
		ExternalToolModule,
		SchoolExternalToolModule,
		ContextExternalToolModule,
		ToolLaunchModule,
	],
	providers: [CommonToolService],
	exports: [
		ExternalToolModule,
		SchoolExternalToolModule,
		ContextExternalToolModule,
		ToolLaunchModule,
		// TODO: remove this when reference loader is using service instead of repo
		CommonToolService,
	],
})
export class ToolModule {}
