import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { CoreModule } from '@src/core';
import { config } from './course-export-import.config';

@Module({
	imports: [CoreModule, HttpModule, ConfigModule.forRoot(createConfigModuleOptions(config))],
})
export class CommonCartridgeApiModule {}
