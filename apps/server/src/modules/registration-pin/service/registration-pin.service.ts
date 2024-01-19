import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { DataDeletionDomainOperationLoggable } from '@shared/common/loggable';
import { DomainModel, StatusModel } from '@shared/domain/types';
import { RegistrationPinRepo } from '../repo';

@Injectable()
export class RegistrationPinService {
	constructor(private readonly registrationPinRepo: RegistrationPinRepo, private readonly logger: Logger) {
		this.logger.setContext(RegistrationPinService.name);
	}

	async deleteRegistrationPinByEmail(email: string): Promise<number> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Deleting user data from RegistrationPin',
				DomainModel.REGISTRATIONPIN,
				email,
				StatusModel.PENDING
			)
		);
		const result = await this.registrationPinRepo.deleteRegistrationPinByEmail(email);
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully deleted user data from RegistrationPin',
				DomainModel.REGISTRATIONPIN,
				email,
				StatusModel.FINISHED,
				0,
				result
			)
		);

		return result;
	}
}
