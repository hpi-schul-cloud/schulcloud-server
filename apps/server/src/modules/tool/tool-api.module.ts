import { Module } from '@nestjs/common';
import { AuthorizationModule } from '@src/modules/authorization';
import { LtiToolRepo } from '@shared/repo';
import { Lti11Uc } from './uc/lti11.uc';
import { LtiRoleMapper } from './uc/mapper/lti-role.mapper';
import { UserModule } from '../user';
import { ToolController } from './controller/tool.controller';
import { Lti11ResponseMapper } from './controller/mapper/lti11-response.mapper';
import { ExternalToolUc } from './uc/external-tool.uc';
import { ExternalToolRequestMapper } from './controller/mapper/external-tool-request.mapper';
import { ExternalToolResponseMapper } from './controller/mapper/external-tool-response.mapper';
import { ToolModule } from './tool.module';
import { LoggerModule } from '../../core/logger';

@Module({
	imports: [ToolModule, UserModule, AuthorizationModule, LoggerModule],
	controllers: [ToolController],
	providers: [
		Lti11Uc,
		LtiRoleMapper,
		Lti11ResponseMapper,
		LtiToolRepo,
		ExternalToolUc,
		ExternalToolRequestMapper,
		ExternalToolResponseMapper,
	],
})
export class ToolApiModule {}
