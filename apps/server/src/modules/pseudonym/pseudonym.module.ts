import { Module } from '@nestjs/common';
import { PseudonymService } from './service/pseudonym.service';

@Module({
	providers: [PseudonymService],
	exports: [PseudonymService],
})
export class PseudonymModule {}
