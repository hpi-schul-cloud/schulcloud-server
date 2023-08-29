import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '..';
import { DemoSchoolController } from './controller/demo-school.controller';
import { DemoModule } from './demo.module';
import { DemoSchoolUc } from './uc';

@Module({
	imports: [DemoModule, LoggerModule, AuthorizationModule],
	controllers: [DemoSchoolController],
	providers: [DemoSchoolUc],
})
export class DemoApiModule {}
