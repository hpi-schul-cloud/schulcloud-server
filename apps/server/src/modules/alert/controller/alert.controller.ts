import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Controller, Get } from '@nestjs/common';
import { AlertUc } from '../uc';
import { AlertResponse } from './dto';

@ApiTags('Alert')
@Controller('alert')
export class AlertController {
	constructor(private readonly alertUc: AlertUc) {}

	@ApiOperation({ summary: 'Get allerts' })
	@ApiResponse({ status: 201, type: AlertResponse })
	@Get()
	public async find() {
		const messages = await this.alertUc.find();

		return new AlertResponse(messages);
	}
}
