import { Module } from '@nestjs/common';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import { SchoolModule } from './school.module';
import { SchoolController } from './controller/school.controller';
import { SchoolService } from './service/school.service';

@Module({
	imports: [SchoolModule],
	controllers: [SchoolController],
	providers: [SchoolUc, SchoolService],
})
export class SchoolApiModule {}
