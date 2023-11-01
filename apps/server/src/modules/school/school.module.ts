import { Module } from '@nestjs/common';
import { SchoolService, SchoolYearService, SCHOOL_REPO, SCHOOL_YEAR_REPO } from './domain';
import { SchoolYearMikroOrmRepo } from './repo/mikro-orm/school-year.repo';
import { SchoolMikroOrmRepo } from './repo/mikro-orm/school.repo';

@Module({
	providers: [
		SchoolService,
		SchoolYearService,
		{ provide: SCHOOL_REPO, useClass: SchoolMikroOrmRepo },
		{ provide: SCHOOL_YEAR_REPO, useClass: SchoolYearMikroOrmRepo },
	],
	exports: [SchoolService, SchoolYearService],
})
export class SchoolModule {}
