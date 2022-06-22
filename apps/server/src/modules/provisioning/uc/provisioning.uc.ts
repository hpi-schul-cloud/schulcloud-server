import {Injectable} from '@nestjs/common';
import {UserUc} from "@src/modules/user/uc";

@Injectable()
export class ProvisioningUc {
    constructor(private readonly userUc: UserUc, private readonly schoolUc: SchoolUc) {
    }

    async run(sub: string, systemId: string) {
        await this.userUc.save(...);
        await this.schoolUc.save(...);
    }
}
