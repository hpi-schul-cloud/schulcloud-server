import { forwardRef, Module } from '@nestjs/common';
import { SchoolRepo } from '@shared/repo';
import { SchoolService } from '@src/modules/school/service/school.service';
import { LoggerModule } from '@src/core/logger';
import { SchoolExternalToolUc } from './uc/school-external-tool.uc';
import { ToolApiModule } from '../tool';

@Module({
	imports: [LoggerModule, forwardRef(() => ToolApiModule)],
	providers: [SchoolRepo, SchoolService, SchoolExternalToolUc],
	exports: [SchoolService],
})
export class SchoolModule {}
