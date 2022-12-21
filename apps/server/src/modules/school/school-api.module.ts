import { forwardRef, Module } from '@nestjs/common';
import { AuthorizationModule } from '@src/modules/authorization';
import { SchoolUc } from './uc/school.uc';
import { SchoolModule } from './school.module';
import { SchoolController } from './controller/school.controller';
import { LoggerModule } from '../../core/logger';
import { SchoolExternalToolController } from './controller/school-external-tool.controller';

@Module({
	imports: [forwardRef(() => SchoolModule), AuthorizationModule, LoggerModule],
	controllers: [SchoolController, SchoolExternalToolController],
	providers: [SchoolUc],
})
export class SchoolApiModule {}
