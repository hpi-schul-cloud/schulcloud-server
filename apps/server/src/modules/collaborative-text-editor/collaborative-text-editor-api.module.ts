import { AuthorizationModule } from '@modules/authorization';
import { forwardRef, Module } from '@nestjs/common';
import { BoardModule } from '../board';
import { CollaborativeTextEditorModule } from './collaborative-text-editor.module';
import { CollaborativeTextEditorController } from './controller/collaborative-text-editor.controller';
import { CollaborativeTextEditorUc } from './uc/collaborative-text-editor.uc';

@Module({
	imports: [CollaborativeTextEditorModule, forwardRef(() => AuthorizationModule), BoardModule],
	controllers: [CollaborativeTextEditorController],
	providers: [CollaborativeTextEditorUc],
})
export class CollaborativeTextEditorApiModule {}
