import { forwardRef, Module } from '@nestjs/common';
import { ContextExternalToolModule } from './context-external-tool';
import { SchoolExternalToolModule } from './school-external-tool';
import { ExternalToolModule } from './external-tool';
import { CommonToolModule } from './common';
import { ToolLaunchModule } from './tool-launch';
import { CommonToolService } from './common/service';
import { ToolConfigModule } from './tool-config.module';

@Module({
	imports: [
		ToolConfigModule,
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
