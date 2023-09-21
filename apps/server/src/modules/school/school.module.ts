import { Module } from '@nestjs/common';
import { SCHOOL_REPO } from './domain';
import { SchoolService } from './domain/service/school.service';
import { SchoolMongoRepo } from './repo/school.repo';

@Module({
	providers: [SchoolService, { provide: SCHOOL_REPO, useClass: SchoolMongoRepo }],
	exports: [SchoolService],
})
export class SchoolModule {}
