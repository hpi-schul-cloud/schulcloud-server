import { Injectable } from '@nestjs/common';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { LtiToolRepo } from '@shared/repo';

@Injectable()
export class LtiToolService {
	constructor(private readonly ltiToolRepo: LtiToolRepo) {}

	public async findByClientIdAndIsLocal(clientId: string, isLocal: boolean): Promise<LtiToolDO | null> {
		const ltiTool: Promise<LtiToolDO | null> = this.ltiToolRepo.findByClientIdAndIsLocal(clientId, isLocal);

		return ltiTool;
	}
}
