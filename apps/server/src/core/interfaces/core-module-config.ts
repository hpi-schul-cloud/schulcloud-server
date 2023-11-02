import { IInterceptorConfig } from '@shared/common';
import { ILoggerConfig } from '../logger';

export interface CoreModuleConfig extends IInterceptorConfig, ILoggerConfig {}
