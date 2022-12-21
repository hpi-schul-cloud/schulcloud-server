import { forwardRef, Module } from '@nestjs/common';
import { SchoolRepo } from '@shared/repo';
import { SchoolService } from '@src/modules/school/service/school.service';
import { LoggerModule } from '@src/core/logger';
// eslint-disable-next-line import/no-cycle
import { ToolModule } from '../tool';

@Module({
	imports: [LoggerModule, forwardRef(() => ToolModule)],
	providers: [SchoolRepo, SchoolService],
	exports: [SchoolService],
})
export class SchoolModule {}
