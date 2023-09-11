import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { AccountModule, LearnroomModule, LessonModule, RoleModule, UserModule } from '..';
import { SchoolModule } from '../school';
import { DemoSchoolService } from './service/demo-school.service';

@Module({
	imports: [LoggerModule, SchoolModule, UserModule, RoleModule, AccountModule, LearnroomModule, LessonModule],
	providers: [DemoSchoolService],
	exports: [DemoSchoolService],
})
export class DemoModule {}
