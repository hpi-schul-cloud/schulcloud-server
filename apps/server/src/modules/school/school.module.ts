import { Module } from '@nestjs/common';
import { SCHOOL_REPO } from './domain';
import { SchoolService } from './domain/service/school.service';
import { SchoolMikroOrmRepo } from './repo/school.repo';

@Module({
	providers: [SchoolService, { provide: SCHOOL_REPO, useClass: SchoolMikroOrmRepo }],
	exports: [SchoolService],
})
export class SchoolModule {}
