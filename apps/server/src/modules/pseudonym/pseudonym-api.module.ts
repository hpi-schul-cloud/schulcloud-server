import { Module } from '@nestjs/common';
import { AuthorizationModule } from '@src/modules/authorization';
import { PseudonymModule } from './pseudonym.module';
import { PseudonymController } from './controller/pseudonym.controller';
import { PseudonymUc } from './uc';
import { LegacySchoolModule } from '../legacy-school';

@Module({
	imports: [PseudonymModule, AuthorizationModule, LegacySchoolModule],
	providers: [PseudonymUc],
	controllers: [PseudonymController],
})
export class PseudonymApiModule {}
