import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { DataDeletionDomainOperationLoggable } from '@shared/common/loggable';
import { DomainModel, OperationType, StatusModel } from '@shared/domain/types';
import { DomainOperation } from '@shared/domain/interface';
import { DomainOperationBuilder } from '@shared/domain/builder';
import { RegistrationPinRepo } from '../repo';

@Injectable()
export class RegistrationPinService {
	constructor(private readonly registrationPinRepo: RegistrationPinRepo, private readonly logger: Logger) {
		this.logger.setContext(RegistrationPinService.name);
	}

	async deleteRegistrationPinByEmail(email: string): Promise<DomainOperation> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Deleting user data from RegistrationPin',
				DomainModel.REGISTRATIONPIN,
				email,
				StatusModel.PENDING
			)
		);
		const response = await this.registrationPinRepo.deleteRegistrationPinByEmail(email);

		const deletedRegistrationPins = response !== null ? [response] : [];

		const numberOfDeletedRegistrationPins = deletedRegistrationPins.length;

		const result = DomainOperationBuilder.build(
			DomainModel.REGISTRATIONPIN,
			OperationType.DELETE,
			numberOfDeletedRegistrationPins,
			deletedRegistrationPins
		);

		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully deleted user data from RegistrationPin',
				DomainModel.REGISTRATIONPIN,
				email,
				StatusModel.FINISHED,
				0,
				numberOfDeletedRegistrationPins
			)
		);

		return result;
	}
}
