import { Module } from '@nestjs/common';
import { SystemModule } from '../system';
import { FederalStateService, SCHOOL_REPO, SCHOOL_YEAR_REPO, SchoolService, SchoolYearService } from './domain';
import { SystemDeletedHandler } from './domain/event-handler';
import { FederalStateRepo, SchoolYearMikroOrmRepo } from './repo';
import { SchoolMikroOrmRepo } from './repo/mikro-orm/school.repo';

@Module({
	imports: [SystemModule],
	providers: [
		SchoolService,
		SchoolYearService,
		FederalStateService,
		{ provide: SCHOOL_REPO, useClass: SchoolMikroOrmRepo },
		{ provide: SCHOOL_YEAR_REPO, useClass: SchoolYearMikroOrmRepo },
		FederalStateRepo,
		SystemDeletedHandler,
	],
	exports: [SchoolService, SchoolYearService, FederalStateService],
})
export class SchoolModule {}
