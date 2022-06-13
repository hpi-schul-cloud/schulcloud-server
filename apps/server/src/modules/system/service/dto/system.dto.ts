import {OauthConfigDto} from "@src/modules/system/service/dto/oauth-config.dto";

export class SystemDto {

    constructor(system: SystemDto) {
        this.type = system.type;
        this.url = system.url;
        this.alias = system.alias;
        this.oauthConfig = system.oauthConfig;
    }

    type!: string;

    url?: string;

    alias?: string;

    oauthConfig?: OauthConfigDto;
}