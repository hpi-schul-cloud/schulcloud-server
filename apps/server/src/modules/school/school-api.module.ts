import { Module } from '@nestjs/common';
import { AuthorizationModule } from '@src/modules/authorization';
import { SchoolUc } from './uc/school.uc';
import { SchoolModule } from './school.module';
import { SchoolController } from './controller/school.controller';
import { LoggerModule } from '../../core/logger';
import { SchoolExternalToolController } from './controller/school-external-tool.controller';
import { ToolModule } from '../tool';
import { SchoolExternalToolUc } from './uc/school-external-tool.uc';
import { SchoolExternalToolMapper } from './controller/mapper/school-external-tool.mapper';

@Module({
	imports: [SchoolModule, AuthorizationModule, LoggerModule, ToolModule],
	controllers: [SchoolController, SchoolExternalToolController],
	providers: [SchoolUc, SchoolExternalToolUc, SchoolExternalToolMapper],
})
export class SchoolApiModule {}
