import { AuthorizationModule } from '@modules/authorization';
import { SystemModule } from '@modules/system';
import { Module } from '@nestjs/common';
import { FederalStateService, SCHOOL_REPO, SCHOOL_YEAR_REPO, SchoolService, SchoolYearService } from './domain';
import { SystemDeletedHandler } from './domain/event-handler';
import { SchoolAuthorizableService } from './domain/service/school-authorizable.service';
import { FederalStateRepo, SchoolMikroOrmRepo, SchoolYearMikroOrmRepo } from './repo';

@Module({
	imports: [SystemModule, AuthorizationModule],
	providers: [
		SchoolService,
		SchoolYearService,
		FederalStateService,
		{ provide: SCHOOL_REPO, useClass: SchoolMikroOrmRepo },
		{ provide: SCHOOL_YEAR_REPO, useClass: SchoolYearMikroOrmRepo },
		FederalStateRepo,
		SystemDeletedHandler,
		SchoolAuthorizableService,
	],
	exports: [SchoolService, SchoolYearService, FederalStateService],
})
export class SchoolModule {}
