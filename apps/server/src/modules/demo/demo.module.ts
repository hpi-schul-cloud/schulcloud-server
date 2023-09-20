import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { AccountModule, LearnroomModule, LegacySchoolModule, LessonModule, RoleModule, UserModule } from '..';
import { DemoSchoolService } from './service/demo-school.service';

@Module({
	imports: [LoggerModule, LegacySchoolModule, UserModule, RoleModule, AccountModule, LearnroomModule, LessonModule],
	providers: [DemoSchoolService],
	exports: [DemoSchoolService],
})
export class DemoModule {}
