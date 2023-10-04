import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { SCHOOL_REPO } from './domain';
import { SchoolService } from './domain/service/school.service';
import { SchoolMikroOrmRepo } from './repo/school.repo';
import { config } from './school.config';

@Module({
	imports: [ConfigModule.forRoot(createConfigModuleOptions(config))],
	providers: [SchoolService, { provide: SCHOOL_REPO, useClass: SchoolMikroOrmRepo }],
	exports: [SchoolService],
})
export class SchoolModule {}
