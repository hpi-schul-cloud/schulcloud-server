import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { CollaborativeTextEditorAdapter } from './collaborative-text-editor.adapter';
import { CollaborativeTextEditorService } from './service/collaborative-text-editor.service';

@Module({
	imports: [LoggerModule],
	providers: [CollaborativeTextEditorService, CollaborativeTextEditorAdapter],
	exports: [CollaborativeTextEditorService],
})
export class CollaborativeTextEditorModule {}
