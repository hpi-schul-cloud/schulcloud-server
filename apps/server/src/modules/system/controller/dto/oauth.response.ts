import {ApiProperty} from "@nestjs/swagger";
import {OauthConfigDto} from "@src/modules/system/service/dto/oauth-config.dto";

export class OauthResponse {
    constructor({data}: OauthResponse) {
        this.data = data;
    }

    @ApiProperty()
    data: OauthConfigDto[];
}