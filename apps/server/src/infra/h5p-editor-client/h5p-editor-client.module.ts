import { Module } from '@nestjs/common';
import { H5pEditorProducer } from './service';

@Module({
	providers: [H5pEditorProducer],
	exports: [H5pEditorProducer],
})
export class H5pEditorClientModule {}
