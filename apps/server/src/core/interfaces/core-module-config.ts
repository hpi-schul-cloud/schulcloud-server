import { IInterceptorConfig } from '@shared/common';
import { ILoggerConfig } from '../logger';

export interface ICoreModuleConfig extends IInterceptorConfig, ILoggerConfig {}
