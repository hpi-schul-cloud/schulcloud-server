import {Injectable} from '@nestjs/common';
import {Logger} from '@src/core/logger';
import {SystemService} from "@src/modules/system/service/system.service";
import {OauthResponse} from "@src/modules/system/controller/dto/oauth.response";
import {OauthResponseMapper} from "@src/modules/system/mapper/oauth-response.mapper";
import {OauthConfigDto} from "@src/modules/system/service/dto/oauth-config.dto";
import {SystemDto} from "@src/modules/system/service/dto/system.dto";

@Injectable()
export class SystemUc {
    constructor(
        private readonly systemService: SystemService,
        private readonly oauthResponseMapper: OauthResponseMapper,
        private logger: Logger
    ) {
        this.logger.setContext(SystemUc.name);
    }

    async getOauthConfigs(): Promise<OauthResponse> {
        let systems: SystemDto[] = await this.systemService.findOauthSystems();
        let configs: OauthConfigDto[];
        systems.forEach(dto => configs.push(dto.oauthConfig));
        return this.oauthResponseMapper.mapFromDtoToResponse(configs);
    }
}
