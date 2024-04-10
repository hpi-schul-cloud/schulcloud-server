import { AuthorizationModule } from '@modules/authorization';
import { forwardRef, Module } from '@nestjs/common';
import { CollaborativeTextEditorModule } from './collaborative-text-editor.module';
import { CollaborativeTextEditorController } from './controller/collaborative-text-editor.controller';
import { CollaborativeTextEditorUc } from './uc/collaborative-text-editor.uc';

@Module({
	imports: [CollaborativeTextEditorModule, forwardRef(() => AuthorizationModule)],
	controllers: [CollaborativeTextEditorController],
	providers: [CollaborativeTextEditorUc],
})
export class CollaborativeTextEditorApiModule {}
