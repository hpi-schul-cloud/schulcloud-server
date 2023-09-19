import { Module } from '@nestjs/common';
import { SchoolController } from './controller/school.controller';
import { SchoolUc } from './domain/uc/school.uc';
import { SchoolModule } from './school.module';

@Module({
	imports: [SchoolModule],
	controllers: [SchoolController],
	providers: [SchoolUc],
})
export class SchoolApiModule {}
