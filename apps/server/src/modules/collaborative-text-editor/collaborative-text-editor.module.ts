import { LoggerModule } from '@core/logger';
import { EtherpadClientModule } from '@infra/etherpad-client';
import { Module } from '@nestjs/common';
import { etherpadClientConfig } from './config';
import { CollaborativeTextEditorService } from './service/collaborative-text-editor.service';

@Module({
	imports: [LoggerModule, EtherpadClientModule.register(etherpadClientConfig)],
	providers: [CollaborativeTextEditorService],
	exports: [CollaborativeTextEditorService],
})
export class CollaborativeTextEditorModule {}
