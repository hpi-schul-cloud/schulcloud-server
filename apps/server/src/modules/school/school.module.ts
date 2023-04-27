import { Module } from '@nestjs/common';
import { SchoolRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { SchoolService } from '@src/modules/school/service/school.service';
import { SystemModule } from '@src/modules/system';
import { UserLoginMigrationModule } from '@src/modules/user-login-migration';

@Module({
	imports: [LoggerModule, SystemModule, UserLoginMigrationModule],
	providers: [SchoolRepo, SchoolService],
	exports: [SchoolService],
})
export class SchoolModule {}
