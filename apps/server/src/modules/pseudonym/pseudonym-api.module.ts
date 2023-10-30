import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module';
import { LegacySchoolModule } from '../legacy-school/legacy-school.module';
import { PseudonymController } from './controller/pseudonym.controller';
import { PseudonymModule } from './pseudonym.module';
import { PseudonymUc } from './uc/pseudonym.uc';

@Module({
	imports: [PseudonymModule, AuthorizationModule, LegacySchoolModule],
	providers: [PseudonymUc],
	controllers: [PseudonymController],
})
export class PseudonymApiModule {}
