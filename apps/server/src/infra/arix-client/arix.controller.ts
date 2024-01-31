import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ArixRestClient } from './arix-rest-client';

@ApiTags('Arix')
@Controller('arix')
export class ArixController {
	constructor(private readonly arixRestClient: ArixRestClient) {}

	@Get()
	public async test(): Promise<string> {
		await this.arixRestClient.runArixService();
		return 'Hello world';
	}
}
