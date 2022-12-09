import { Module } from '@nestjs/common';
import { SchoolRepo } from '@shared/repo';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import { SchoolService } from '@src/modules/school/service/school.service';

@Module({
	providers: [SchoolRepo, SchoolUc, SchoolService],
	exports: [SchoolService],
})
export class SchoolModule {}
