import { Module } from '@nestjs/common';
import { SchoolRepo } from './domain';
import { SchoolService } from './domain/service/school.service';
import { MikroOrmSchoolRepo } from './repo/school.repo';

@Module({
	providers: [SchoolService, { provide: SchoolRepo, useClass: MikroOrmSchoolRepo }],
	exports: [SchoolService],
})
export class SchoolModule {}
