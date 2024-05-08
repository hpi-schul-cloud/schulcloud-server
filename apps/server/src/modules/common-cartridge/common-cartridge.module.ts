import { Module } from '@nestjs/common';
import { CoreModule } from '@src/core';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { config } from '../files-storage/files-storage.config';

@Module({
	imports: [CoreModule, ConfigModule.forRoot(createConfigModuleOptions(config))],
})
export class CommonCartridgeModule {}
