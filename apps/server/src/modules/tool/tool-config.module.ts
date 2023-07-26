import { Module } from '@nestjs/common';
import ToolConfiguration, { ToolFeatures } from './tool-config';

@Module({
	providers: [
		{
			provide: ToolFeatures,
			useValue: ToolConfiguration.toolFeatures,
		},
	],
	exports: [ToolFeatures],
})
export class ToolConfigModule {}
