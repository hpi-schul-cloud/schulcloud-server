import { Module } from '@nestjs/common';
import ToolConfiguration, { ToolFeatures } from './tool-config';
import { ContextExternalToolModule } from './context-external-tool';
import { SchoolExternalToolModule } from './school-external-tool';
import { ExternalToolModule } from './external-tool';
import { CommonToolModule } from './common';
import { ToolLaunchModule } from './tool-launch';
import { CommonToolService } from './common/service';

@Module({
	imports: [
		CommonToolModule,
		ExternalToolModule,
		SchoolExternalToolModule,
		ContextExternalToolModule,
		ToolLaunchModule,
	],
	providers: [
		{
			provide: ToolFeatures,
			useValue: ToolConfiguration.toolFeatures,
		},
		CommonToolService,
	],
	exports: [
		ToolFeatures,
		ExternalToolModule,
		SchoolExternalToolModule,
		ContextExternalToolModule,
		ToolLaunchModule,
		// TODO: remove this when reference loader is using service instead of repo
		CommonToolService,
	],
})
export class ToolModule {}
