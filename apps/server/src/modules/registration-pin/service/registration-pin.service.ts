import {
	DataDeletionDomainOperationLoggable,
	DeletionErrorLoggableException,
	DeletionService,
	DomainDeletionReport,
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
	StatusModel,
} from '@modules/deletion';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import { RegistrationPinEntity } from '../entity';
import { RegistrationPinRepo } from '../repo';

@Injectable()
export class RegistrationPinService implements DeletionService {
	constructor(private readonly registrationPinRepo: RegistrationPinRepo, private readonly logger: Logger) {
		this.logger.setContext(RegistrationPinService.name);
	}

	public async findByEmail(email: string): Promise<RegistrationPinEntity[]> {
		const [registrationPins] = await this.registrationPinRepo.findAllByEmail(email);

		return registrationPins;
	}

	public async deleteUserData(email: string): Promise<DomainDeletionReport> {
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
			throw new DeletionErrorLoggableException(`Failed to delete user data from RegistrationPin for '${email}'`);
		}

		const result = DomainDeletionReportBuilder.build(DomainName.REGISTRATIONPIN, [
			DomainOperationReportBuilder.build(
				OperationType.DELETE,
				numberOfDeletedRegistrationPins,
				this.getRegistrationPinsId(registrationPinToDelete)
			),
		]);

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
