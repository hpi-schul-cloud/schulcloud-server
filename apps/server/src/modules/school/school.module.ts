import { Module } from '@nestjs/common';
import { SchoolRepo } from '@shared/repo';
import { SchoolService } from '@src/modules/school/service/school.service';
import { LoggerModule } from '@src/core/logger';
import { SchoolMapper } from './mapper/school.mapper';
import { UserDORepo } from '@shared/repo/user/user-do.repo';
import { TransactionUtil } from '@shared/common/utils/transaction.util';

@Module({
	imports: [LoggerModule],
	providers: [SchoolRepo, UserDORepo, TransactionUtil, SchoolService, SchoolMapper],
	exports: [SchoolService, SchoolMapper],
})
export class SchoolModule {}
