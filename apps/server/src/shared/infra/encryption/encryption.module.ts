import { Module } from '@nestjs/common';
import { SymetricKeyEncryptionService } from './encryption.service';

@Module({
	providers: [SymetricKeyEncryptionService],
	exports: [SymetricKeyEncryptionService],
})
export class EncryptionModule {}
