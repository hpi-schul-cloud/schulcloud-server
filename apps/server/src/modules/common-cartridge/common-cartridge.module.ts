import { Module } from '@nestjs/common';
import { CoreModule } from '@src/core';
import { LoggerModule } from '@src/core/logger';

@Module({
	imports: [CoreModule, LoggerModule],
})
export class CommonCartridgeModule {}
