import {OauthResponse} from "@src/modules/system/controller/dto/oauth.response";
import {OauthConfigDto} from "@src/modules/system/service/dto/oauth-config.dto";

export class OauthResponseMapper {
    static mapFromDtoToResponse(oauthConfigs: OauthConfigDto[]): OauthResponse {
        return new OauthResponse({
            data: oauthConfigs
        });
    }
}