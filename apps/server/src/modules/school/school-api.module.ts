import { Module } from '@nestjs/common';
import { AuthorizationModule } from '@modules/authorization/authorization.module';
import { SchoolModule } from './school.module';
import { SchoolController } from './api/school.controller';
import { SchoolUc } from './api/school.uc';

@Module({
	imports: [SchoolModule, AuthorizationModule],
	controllers: [SchoolController],
	providers: [SchoolUc],
})
export class SchoolApiModule {}
