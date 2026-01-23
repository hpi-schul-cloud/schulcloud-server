import { ConfigurationModule } from '@infra/configuration';
import { AuthorizationModule } from '@modules/authorization';
import { MediaSourceModule } from '@modules/media-source/media-source.module';
import { SchoolModule } from '@modules/school';
import { forwardRef, Module } from '@nestjs/common';
import { CommonToolModule } from '../common';
import { ExternalToolModule } from '../external-tool';
import { TOOL_CONFIG_TOKEN, ToolConfig } from '../tool-config';
import { SchoolExternalToolRule } from './authorization/school-external-tool.rule';
import { SchoolExternalToolAuthorizableService, SchoolExternalToolService } from './service';

@Module({
	imports: [
		forwardRef(() => CommonToolModule),
		forwardRef(() => ExternalToolModule),
		AuthorizationModule,
		MediaSourceModule,
		ConfigurationModule.register(TOOL_CONFIG_TOKEN, ToolConfig),
		SchoolModule,
	],
	providers: [SchoolExternalToolService, SchoolExternalToolRule, SchoolExternalToolAuthorizableService],
	exports: [SchoolExternalToolService],
})
export class SchoolExternalToolModule {}
