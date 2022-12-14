import { Module } from '@nestjs/common';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import { SchoolModule } from './school.module';
import { SchoolController } from './controller/school.controller';
import { SchoolService } from './service/school.service';
import { AuthorizationModule, AuthorizationService } from '../authorization';
import { LoggerModule } from '../../core/logger';

@Module({
	imports: [SchoolModule, AuthorizationModule, LoggerModule],
	controllers: [SchoolController],
	providers: [SchoolUc, SchoolService, AuthorizationService],
})
export class SchoolApiModule {}
