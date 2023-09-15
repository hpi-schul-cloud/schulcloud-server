import { Module } from '@nestjs/common';
import { PseudonymModule } from './pseudonym.module';
import { PseudonymController } from './controller/pseudonym.controller';
import { PseudonymUc } from './uc';
import { AuthorizationModule } from '../authorization';

@Module({
	imports: [PseudonymModule, AuthorizationModule],
	providers: [PseudonymUc],
	controllers: [PseudonymController],
})
export class PseudonymApiModule {}
