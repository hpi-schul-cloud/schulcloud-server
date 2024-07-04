import { Module } from '@nestjs/common';
import { SystemModule } from '../system';
import { SCHOOL_REPO, SCHOOL_YEAR_REPO, SchoolService, SchoolYearService } from './domain';
import { SystemDeletedHandler } from './domain/event-handler/SystemDeletedHandler';
import { SchoolYearMikroOrmRepo } from './repo/mikro-orm/school-year.repo';
import { SchoolMikroOrmRepo } from './repo/mikro-orm/school.repo';

@Module({
	imports: [SystemModule],
	providers: [
		SchoolService,
		SchoolYearService,
		{ provide: SCHOOL_REPO, useClass: SchoolMikroOrmRepo },
		{ provide: SCHOOL_YEAR_REPO, useClass: SchoolYearMikroOrmRepo },
		SystemDeletedHandler,
	],
	exports: [SchoolService, SchoolYearService],
})
export class SchoolModule {}
