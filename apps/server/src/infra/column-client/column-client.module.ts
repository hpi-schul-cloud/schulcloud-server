import { Module } from '@nestjs/common';
import { ColumnClientAdapter } from './column-client.adapter';

@Module({
	providers: [ColumnClientAdapter],
	exports: [ColumnClientAdapter],
})
export class ColumnClientModule {}
