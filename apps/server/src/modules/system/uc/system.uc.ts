import {Injectable} from '@nestjs/common';
import {SystemService} from '@src/modules/system/service/system.service';
import {OauthResponse} from '@src/modules/system/controller/dto/oauth.response';
import {OauthResponseMapper} from '@src/modules/system/mapper/oauth-response.mapper';
import {OauthConfigDto} from "@src/modules/system/service/dto/oauth-config.dto";

@Injectable()
export class SystemUc {
    constructor(private readonly systemService: SystemService) {
    }

    async getOauthConfigs(): Promise<OauthResponse> {
        const configs: OauthConfigDto[] = await this.systemService.findOauthConfigs();
        return OauthResponseMapper.mapFromDtoToResponse(configs);
    }
}
