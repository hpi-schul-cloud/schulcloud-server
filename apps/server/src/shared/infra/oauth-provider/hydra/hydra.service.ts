import { OauthProviderService } from '@shared/infra/oauth-provider';
import { Injectable } from '@nestjs/common';

@Injectable()
export class HydraService extends OauthProviderService {}
