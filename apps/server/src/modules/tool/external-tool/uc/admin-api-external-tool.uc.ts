import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { ExternalTool } from '../domain';
import { ExternalToolService } from '../service';
import { ExternalToolCreate } from './dto';

@Injectable()
export class AdminApiExternalToolUc {
	constructor(private readonly externalToolService: ExternalToolService) {}

	public async createExternalTool(externalToolCreate: ExternalToolCreate): Promise<ExternalTool> {
		const { thumbnailUrl, logoUrl, ...externalToolCreateProps } = externalToolCreate;

		const pendingExternalTool: ExternalTool = new ExternalTool({
			...externalToolCreateProps,
			id: new ObjectId().toHexString(),
		});

		const savedExternalTool: ExternalTool = await this.externalToolService.createExternalTool(pendingExternalTool);

		return savedExternalTool;
	}
}
