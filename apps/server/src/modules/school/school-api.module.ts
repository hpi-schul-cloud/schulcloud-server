import { Module } from '@nestjs/common';
import { AuthorizationModule } from '@src/modules/authorization/authorization.module';
import { SchoolController } from './api/controller';
import { SchoolUc } from './domain';
import { SchoolModule } from './school.module';

@Module({
	imports: [SchoolModule, AuthorizationModule],
	controllers: [SchoolController],
	providers: [SchoolUc],
})
export class SchoolApiModule {}
