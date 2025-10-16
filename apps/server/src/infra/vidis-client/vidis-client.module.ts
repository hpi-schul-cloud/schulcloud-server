import { EncryptionModule } from '@infra/encryption';
import { Module } from '@nestjs/common';
import { VidisClientAdapter } from './vidis-client.adapter';

@Module({
	imports: [EncryptionModule],
	providers: [VidisClientAdapter],
	exports: [VidisClientAdapter],
})
export class VidisClientModule {}
