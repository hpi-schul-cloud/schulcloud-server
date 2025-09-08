import { AuthorizationModule } from '@modules/authorization/authorization.module';
import { Module } from '@nestjs/common';
import { SchoolController, SchoolUc } from './api';
import { SchoolModule } from './school.module';
import { UserModule } from '../user';
import { ClassModule } from '@modules/class';
import { MoinSchuleClassModule } from '@modules/class-moin-schule/moin-schule-class.module';

@Module({
	imports: [SchoolModule, AuthorizationModule, ClassModule, UserModule, MoinSchuleClassModule],
	controllers: [SchoolController],
	providers: [SchoolUc],
})
export class SchoolApiModule {}
