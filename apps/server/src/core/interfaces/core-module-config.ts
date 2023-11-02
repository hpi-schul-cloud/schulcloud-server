import { InterceptorConfig } from '@shared/common';
import { ILoggerConfig } from '../logger';

export interface CoreModuleConfig extends InterceptorConfig, ILoggerConfig {}
