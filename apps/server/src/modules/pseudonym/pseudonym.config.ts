import { LoggerConfig } from '@src/core/logger';
import { LearnroomConfig } from '@modules/learnroom';
import { ToolConfig } from '@modules/tool';
import { UserConfig } from '@modules/user';

export interface PseudonymConfig extends UserConfig, LearnroomConfig, ToolConfig, LoggerConfig {}
