import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';

@Module({
	imports: [LoggerModule],
	controllers: [],
	providers: [],
	exports: [],
})
export class ProvisioningModule {}
