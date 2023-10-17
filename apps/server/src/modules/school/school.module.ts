import { Module } from '@nestjs/common';
import { SchoolService, SCHOOL_REPO } from './domain';
import { SchoolMikroOrmRepo } from './repo/mikro-orm/school.repo';

@Module({
	providers: [SchoolService, { provide: SCHOOL_REPO, useClass: SchoolMikroOrmRepo }],
	exports: [SchoolService],
})
export class SchoolModule {}
