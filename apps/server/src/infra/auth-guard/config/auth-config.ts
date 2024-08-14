import { authConfig as feathersAuthConfig } from '@src/imports-from-feathers';
import { AuthConfigMapper } from '../mapper';

export const authConfig = AuthConfigMapper.mapFeathersAuthConfigToAuthConfig(feathersAuthConfig);
