import { forwardRef, Module } from '@nestjs/common';
import { CommonToolModule } from './common/common-tool.module';
import { CommonToolService } from './common/service/common-tool.service';
import { ContextExternalToolModule } from './context-external-tool/context-external-tool.module';
import { ExternalToolModule } from './external-tool/external-tool.module';
import { SchoolExternalToolModule } from './school-external-tool/school-external-tool.module';
import { ToolConfigModule } from './tool-config.module';
import { ToolLaunchModule } from './tool-launch/tool-launch.module';

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
