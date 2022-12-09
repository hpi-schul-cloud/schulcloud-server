import { Module } from '@nestjs/common';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import { SchoolModule } from './school.module';
import { SchoolController } from './controller/school.controller';

@Module({
	imports: [SchoolModule],
	controllers: [SchoolController],
	providers: [SchoolUc],
})
export class SchoolApiModule {}
