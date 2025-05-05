import { AuthorizationModule } from '@modules/authorization';
import { LegacySchoolModule } from '@modules/legacy-school';
import { Module } from '@nestjs/common';
import { PseudonymController } from './controller/pseudonym.controller';
import { PseudonymModule } from './pseudonym.module';
import { PseudonymUc } from './uc';

@Module({
	imports: [PseudonymModule, AuthorizationModule, LegacySchoolModule],
	providers: [PseudonymUc],
	controllers: [PseudonymController],
})
export class PseudonymApiModule {}
