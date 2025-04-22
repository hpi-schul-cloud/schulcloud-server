import { Module } from '@nestjs/common';
import { AuthorizationModule } from '@modules/authorization';
import { LegacySchoolModule } from '@modules/legacy-school';
import { PseudonymModule } from './pseudonym.module';
import { PseudonymController } from './controller/pseudonym.controller';
import { PseudonymUc } from './uc';
import { DeletionModule } from '@modules/deletion';

@Module({
	imports: [PseudonymModule, AuthorizationModule, LegacySchoolModule, DeletionModule],
	providers: [PseudonymUc],
	controllers: [PseudonymController],
})
export class PseudonymApiModule {}
