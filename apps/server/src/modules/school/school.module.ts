import { Module } from '@nestjs/common';
import { SchoolRepo } from '@shared/repo';
import { SchoolUc } from '@src/modules/school/uc/school.uc';

@Module({
	providers: [SchoolRepo, SchoolUc],
})
export class SchoolModule {}
