import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Logger } from '@src/core/logger';
import { Response } from 'express';
import { SystemUc } from '../uc/system.uc';
import {SystemDto} from "@src/modules/system/service/dto/system.dto";
import {OauthResponse} from "@src/modules/system/controller/dto/oauth.response";

@ApiTags('System')
@Controller('system')
export class SystemController {
    constructor(private readonly systemUc: SystemUc) {}

    @Get('oauth')
    async getOauthConfigs(
        @Res() res: Response
    ): Promise<OauthResponse> {
        return this.systemUc.getOauthConfigs();
    }
}
