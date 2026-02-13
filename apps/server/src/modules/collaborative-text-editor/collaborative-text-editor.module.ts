import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { EtherpadClientModule } from '@infra/etherpad-client';
import { Module } from '@nestjs/common';
import {
	COLLABORATIVE_TEXT_EDITOR_CONFIG_TOKEN,
	CollaborativeTextEditorConfig,
} from './collaborative-text-editor.config';
import { ETHERPAD_CLIENT_CONFIG_TOKEN, EtherpadClientConfig } from './etherpad-client.config';
import { CollaborativeTextEditorService } from './service/collaborative-text-editor.service';

@Module({
	imports: [
		LoggerModule,
		ConfigurationModule.register(COLLABORATIVE_TEXT_EDITOR_CONFIG_TOKEN, CollaborativeTextEditorConfig),
		EtherpadClientModule.register(ETHERPAD_CLIENT_CONFIG_TOKEN, EtherpadClientConfig),
	],
	providers: [CollaborativeTextEditorService],
	exports: [CollaborativeTextEditorService],
})
export class CollaborativeTextEditorModule {}
