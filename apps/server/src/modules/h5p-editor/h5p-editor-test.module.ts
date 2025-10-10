import { DynamicModule, Module } from '@nestjs/common';
import { MongoDatabaseModuleOptions, MongoMemoryDatabaseModule } from '@testing/database';
import { H5PEditorModule } from './h5p-editor.app.module';
import { TEST_ENTITIES } from './h5p-editor.entity.exports';

@Module({
	imports: [H5PEditorModule, MongoMemoryDatabaseModule.forRoot({ entities: TEST_ENTITIES })],
})
export class H5PEditorTestModule {
	public static forRoot(options?: MongoDatabaseModuleOptions): DynamicModule {
		return {
			module: H5PEditorTestModule,
			imports: [H5PEditorModule, MongoMemoryDatabaseModule.forRoot({ ...options })],
		};
	}
}
