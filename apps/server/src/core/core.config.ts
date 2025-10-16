import { InterceptorConfig } from '@shared/common/interceptor';
import { LoggerConfig } from './logger';

export interface CoreModuleConfig extends InterceptorConfig, LoggerConfig {}
