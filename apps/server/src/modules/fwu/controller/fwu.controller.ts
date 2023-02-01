import { Body, Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticate } from '@src/modules/authentication/decorator/auth.decorator';
import { FwuUc } from '../uc/fwu.uc'

@ApiTags('FWU')
@Authenticate('jwt')
@Controller('fwu')
export class FwuController {
    constructor(private readonly fwuUc: FwuUc) {}

    @Get(':courseId:path')
    async get(@Param() courseId: number, path: String): Promise<any> {
        // TODO: make sure its a user from Brandenburg
        return await this.fwuUc.get(courseId, path);
    }
}
