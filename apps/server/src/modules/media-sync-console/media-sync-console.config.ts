import { ConsoleWriterConfig } from '@infra/console';
import { MediaSourceConfig } from '@modules/media-source';

export interface MediaSyncConsoleConfig extends ConsoleWriterConfig, MediaSourceConfig {}

const config: MediaSyncConsoleConfig = {};

export const mediaSyncConsoleConfig = (): MediaSyncConsoleConfig => config;
