import {Controller, Get} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {SystemUc} from '../uc/system.uc';
import {OauthResponse} from "@src/modules/system/controller/dto/oauth.response";

@ApiTags('System')
@Controller('system')
export class SystemController {
    constructor(private readonly systemUc: SystemUc) {
    }

    @Get('oauth')
    async getOauthConfigs(): Promise<OauthResponse> {
        return this.systemUc.getOauthConfigs();
    }
}
