import { AuthorizationModule } from '@modules/authorization/authorization.module';
import { Module } from '@nestjs/common';
import { SystemModule } from '../system';
import { SchoolController, SchoolUc } from './api';
import { SchoolModule } from './school.module';

@Module({
	imports: [SchoolModule, AuthorizationModule, SystemModule],
	controllers: [SchoolController],
	providers: [SchoolUc],
})
export class SchoolApiModule {}
