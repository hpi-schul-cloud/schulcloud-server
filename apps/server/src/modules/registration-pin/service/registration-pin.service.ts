import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { DataDeletionDomainOperationLoggable } from '@shared/common/loggable';
import { DomainName, EntityId, OperationType, StatusModel } from '@shared/domain/types';
import { DomainOperation } from '@shared/domain/interface';
import { DomainOperationBuilder } from '@shared/domain/builder';
import { RegistrationPinRepo } from '../repo';
import { RegistrationPinEntity } from '../entity';

@Injectable()
export class RegistrationPinService {
	constructor(private readonly registrationPinRepo: RegistrationPinRepo, private readonly logger: Logger) {
		this.logger.setContext(RegistrationPinService.name);
	}

	async deleteRegistrationPinByEmail(email: string): Promise<DomainOperation> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Deleting user data from RegistrationPin',
				DomainName.REGISTRATIONPIN,
				email,
				StatusModel.PENDING
			)
		);
		const [registrationPinToDelete, count] = await this.registrationPinRepo.findAllByEmail(email);
		const numberOfDeletedRegistrationPins = await this.registrationPinRepo.deleteRegistrationPinByEmail(email);

		if (numberOfDeletedRegistrationPins !== count) {
			this.logger.info(
				new DataDeletionDomainOperationLoggable(
					'Failed to delete user data from RegistrationPin',
					DomainName.REGISTRATIONPIN,
					email,
					StatusModel.FAILED,
					0,
					numberOfDeletedRegistrationPins
				)
			);

			throw new Error(`Failed to delete user data from RegistrationPin for '${email}'`);
		}

		const result = DomainOperationBuilder.build(
			DomainName.REGISTRATIONPIN,
			OperationType.DELETE,
			numberOfDeletedRegistrationPins,
			this.getRegistrationPinsId(registrationPinToDelete)
		);

		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully deleted user data from RegistrationPin',
				DomainName.REGISTRATIONPIN,
				email,
				StatusModel.FINISHED,
				0,
				numberOfDeletedRegistrationPins
			)
		);

		return result;
	}

	private getRegistrationPinsId(registrationPins: RegistrationPinEntity[]): EntityId[] {
		return registrationPins.map((registrationPin) => registrationPin.id);
	}
}
