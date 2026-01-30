import { Module } from '@nestjs/common';
import { CoursesClientAdapter } from './courses-client.adapter';

@Module({
	providers: [CoursesClientAdapter],
	exports: [CoursesClientAdapter],
})
export class CoursesClientModule {}
