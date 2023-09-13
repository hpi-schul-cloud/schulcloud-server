import { Module } from '@nestjs/common';
import { PseudonymModule } from './pseudonym.module';
import { PseudonymController } from './controller/pseudonym.controller';

@Module({
	imports: [PseudonymModule],
	controllers: [PseudonymController],
})
export class PseudonymApiModule {}
