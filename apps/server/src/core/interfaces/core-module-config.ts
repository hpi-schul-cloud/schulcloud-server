import { IInterceptorConfig } from '@shared/common/interceptor/interfaces/interceptor-config';
import { ILoggerConfig } from '../logger/interfaces/logger-config';

export interface ICoreModuleConfig extends IInterceptorConfig, ILoggerConfig {}
