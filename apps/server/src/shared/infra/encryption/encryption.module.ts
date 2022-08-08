import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { SymetricKeyEncryptionService } from './encryption.service';

@Module({
	imports: [LoggerModule],
	providers: [SymetricKeyEncryptionService],
	exports: [SymetricKeyEncryptionService],
})
export class EncryptionModule {}
