import { AuthorizationModule } from '@modules/authorization';
import { forwardRef, Module } from '@nestjs/common';
import { BoardModule } from '../board';
import { CollaborativeTextEditorController } from './api/collaborative-text-editor.controller';
import { CollaborativeTextEditorUc } from './api/collaborative-text-editor.uc';
import { CollaborativeTextEditorModule } from './collaborative-text-editor.module';

@Module({
	imports: [CollaborativeTextEditorModule, forwardRef(() => AuthorizationModule), BoardModule],
	controllers: [CollaborativeTextEditorController],
	providers: [CollaborativeTextEditorUc],
})
export class CollaborativeTextEditorApiModule {}
