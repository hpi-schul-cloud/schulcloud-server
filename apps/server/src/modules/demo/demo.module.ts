import { AccountModule } from '@modules/account';
import { LearnroomModule } from '@modules/learnroom';
import { LegacySchoolModule } from '@modules/legacy-school';
import { LessonModule } from '@modules/lesson';
import { RoleModule } from '@modules/role';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { DemoSchoolService } from './service/demo-school.service';

@Module({
	imports: [LoggerModule, LegacySchoolModule, UserModule, RoleModule, AccountModule, LearnroomModule, LessonModule],
	providers: [DemoSchoolService],
	exports: [DemoSchoolService],
})
export class DemoModule {}
