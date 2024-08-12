import { Module } from '@nestjs/common';
import { AdminApiContextExternalToolController } from './context-external-tool/controller';
import { AdminApiContextExternalToolUc } from './context-external-tool/uc';
import { AdminApiExternalToolController } from './external-tool/controller';
import { ExternalToolRequestMapper, ExternalToolResponseMapper } from './external-tool/mapper';
import { AdminApiExternalToolUc } from './external-tool/uc';
import { AdminApiSchoolExternalToolController } from './school-external-tool/controller';
import { AdminApiSchoolExternalToolUc } from './school-external-tool/uc';
import { ToolModule } from './tool.module';

@Module({
	imports: [ToolModule],
	controllers: [
		AdminApiExternalToolController,
		AdminApiSchoolExternalToolController,
		AdminApiContextExternalToolController,
	],
	providers: [
		AdminApiExternalToolUc,
		AdminApiSchoolExternalToolUc,
		AdminApiContextExternalToolUc,
		ExternalToolRequestMapper,
		ExternalToolResponseMapper,
	],
})
export class ToolAdminApiModule {}
