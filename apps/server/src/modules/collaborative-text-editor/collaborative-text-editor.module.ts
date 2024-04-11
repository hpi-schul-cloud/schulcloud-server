import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { EtherpadClientModule } from '@src/infra/etherpad-client';
import { etherpadClientConfig } from './config';
import { CollaborativeTextEditorService } from './service/collaborative-text-editor.service';

@Module({
	imports: [LoggerModule, EtherpadClientModule.register(etherpadClientConfig)],
	providers: [CollaborativeTextEditorService],
	exports: [CollaborativeTextEditorService],
})
export class CollaborativeTextEditorModule {}
