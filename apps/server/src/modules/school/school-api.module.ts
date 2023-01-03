import { Module } from '@nestjs/common';
import { AuthorizationModule } from '@src/modules/authorization';
import { SchoolUc } from './uc/school.uc';
import { SchoolModule } from './school.module';
import { SchoolController } from './controller/school.controller';
import { LoggerModule } from '../../core/logger';

@Module({
	imports: [SchoolModule, AuthorizationModule, LoggerModule],
	controllers: [SchoolController],
	providers: [SchoolUc],
})
export class SchoolApiModule {}
