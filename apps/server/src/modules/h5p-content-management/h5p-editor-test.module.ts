import { Module } from '@nestjs/common';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { H5PEditorAppModule } from './h5p-editor.app.module';
import { TEST_ENTITIES } from './h5p-editor.entity.exports';

@Module({
	imports: [H5PEditorAppModule, MongoMemoryDatabaseModule.forRoot({ entities: TEST_ENTITIES })],
})
export class H5PEditorTestModule {}
