import { Module } from '@nestjs/common';
import { AuthorizationModule } from '@src/modules/authorization';
import { LegacySchoolModule } from '@src/modules/legacy-school';
import { PseudonymModule } from './pseudonym.module';
import { PseudonymController } from './controller/pseudonym.controller';
import { PseudonymUc } from './uc';

@Module({
	imports: [PseudonymModule, AuthorizationModule, LegacySchoolModule],
	providers: [PseudonymUc],
	controllers: [PseudonymController],
})
export class PseudonymApiModule {}
