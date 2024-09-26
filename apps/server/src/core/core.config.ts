import { InterceptorConfig } from '@shared/common';
import { LoggerConfig } from './logger';

export interface CoreModuleConfig extends InterceptorConfig, LoggerConfig {}
