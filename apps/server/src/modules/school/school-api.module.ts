import { Module } from '@nestjs/common';
import { SchoolController } from './api/controller';
import { SchoolUc } from './domain';
import { SchoolModule } from './school.module';

@Module({
	imports: [SchoolModule],
	controllers: [SchoolController],
	providers: [SchoolUc],
})
export class SchoolApiModule {}
