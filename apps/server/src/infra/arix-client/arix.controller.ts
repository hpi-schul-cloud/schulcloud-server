import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ArixTestClient } from './arix-test-client';

@ApiTags('Arix')
@Controller('arix')
export class ArixController {
	constructor(private readonly arixRestClient: ArixTestClient) {}

	@Get()
	public async test(): Promise<string> {
		await this.arixRestClient.getMediaRecord();
		return 'Hello world';
	}
}
