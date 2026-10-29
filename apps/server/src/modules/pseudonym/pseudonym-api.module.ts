import { AuthorizationModule } from '@modules/authorization';
import { LegacySchoolModule } from '@modules/legacy-school';
import { SchoolModule } from '@modules/school';
import { Module } from '@nestjs/common';
import { OptionalJwtAuthGuard } from './controller/optional-jwt-auth.guard';
import { PseudonymController } from './controller/pseudonym.controller';
import { PseudonymUsernameController } from './controller/pseudonym-username.controller';
import { PseudonymModule } from './pseudonym.module';
import { PseudonymUc } from './uc';

@Module({
	imports: [PseudonymModule, AuthorizationModule, LegacySchoolModule, SchoolModule],
	providers: [PseudonymUc, OptionalJwtAuthGuard],
	controllers: [PseudonymController, PseudonymUsernameController],
})
export class PseudonymApiModule {}
