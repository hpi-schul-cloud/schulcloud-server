import { AuthorizationModule } from '@modules/authorization';
import { SystemModule } from '@modules/system';
import { Module } from '@nestjs/common';
import { SchoolController } from './controller';
import { LegacySchoolModule } from './legacy-school.module';
import { SchoolSystemOptionsUc } from './uc';

@Module({
	imports: [LegacySchoolModule, AuthorizationModule, SystemModule],
	controllers: [SchoolController],
	providers: [SchoolSystemOptionsUc],
})
export class LegacySchoolApiModule {}
