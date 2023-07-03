import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';

import { HealthUC } from '../uc';
import { HealthStatusResponse, HealthStatusResponseMapper } from './dto';

@Controller('health')
export class HealthController {
	constructor(private readonly healthUc: HealthUC) {}

	private readonly contentTypeApplicationHealthJSON = 'application/health+json';

	@Get('self')
	getSelfHealth(@Res({ passthrough: true }) res: Response): HealthStatusResponse {
		res.contentType(this.contentTypeApplicationHealthJSON);

		const healthStatus = this.healthUc.checkSelfHealth();

		return HealthStatusResponseMapper.mapToResponse(healthStatus);
	}

	@Get()
	async getOverallHealth(@Res({ passthrough: true }) res: Response): Promise<HealthStatusResponse> {
		res.contentType(this.contentTypeApplicationHealthJSON);

		const healthStatus = await this.healthUc.checkOverallHealth();
		const httpStatus = healthStatus.isPassed() ? HttpStatus.OK : HttpStatus.INTERNAL_SERVER_ERROR;

		res.status(httpStatus);

		return HealthStatusResponseMapper.mapToResponse(healthStatus);
	}
}
