import { Module } from '@nestjs/common';
import { H5PEditorModule } from './h5p-editor.app.module';

@Module({
	imports: [H5PEditorModule],
})
export class H5PEditorTestModule {}
