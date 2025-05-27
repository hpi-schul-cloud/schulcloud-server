import { Module } from '@nestjs/common';
import { H5pEditorClientAdapter } from './h5p-editor-client.adapter';

@Module({
	imports: [],
	providers: [H5pEditorClientAdapter],
	exports: [H5pEditorClientAdapter],
})
export class H5pEditorClientModule {}
