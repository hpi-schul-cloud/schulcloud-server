import { ApiValidationError } from '@shared/common';
import { getMetadataStorage } from 'class-validator';
import { ValidationError } from '@nestjs/common';
import { Loggable } from '../../logger/interfaces';
import { ErrorLogMessage, ValidationErrorLogMessage } from '../../logger/types';
import { ErrorUtils } from '../utils/error.utils';

export class ErrorLoggable implements Loggable {
	constructor(private readonly error: Error) {}

	private readonly classValidatorMetadataStorage = getMetadataStorage();

	getLogMessage(): ErrorLogMessage | ValidationErrorLogMessage {
		let logMessage: ErrorLogMessage | ValidationErrorLogMessage = {
			error: this.error,
			type: '',
		};

		if (this.error instanceof ApiValidationError) {
			logMessage = this.createLogMessageForValidationErrors(this.error);
		} else if (ErrorUtils.isFeathersError(this.error)) {
			logMessage.type = 'Feathers Error';
		} else if (ErrorUtils.isBusinessError(this.error)) {
			logMessage.type = 'Business Error';
		} else if (ErrorUtils.isNestHttpException(this.error)) {
			logMessage.type = 'Technical Error';
		} else {
			logMessage.type = 'Unhandled or Unknown Error';
		}

		return logMessage;
	}

	private createLogMessageForValidationErrors(error: ApiValidationError) {
		const errorMessages = error.validationErrors.map((e) => {
			const value = this.getPropertyValue(e);
			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
			const message = `Wrong property value for '${e.property}' got '${value}' : ${JSON.stringify(e.constraints)}`;
			return message;
		});
		return {
			validationErrors: errorMessages,
			type: 'API Validation Error',
		};
	}

	private getPropertyValue(e: ValidationError): unknown {
		// we can only log a value if we can decide if it is privacy protected
		// that has to be done using the target metadata of class-validator (see @PrivacyProtect decorator)
		if (e.target && !this.isPropertyPrivacyProtected(e.target, e.property)) {
			return e.value;
		}
		return '######';
	}

	private isPropertyPrivacyProtected(target: Record<string, unknown>, property: string): boolean {
		const metadatas = this.classValidatorMetadataStorage.getTargetValidationMetadatas(
			target.constructor,
			'',
			true,
			true
		);

		const privacyProtected = metadatas.some(
			(validationMetadata) =>
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				validationMetadata.propertyName === property && validationMetadata.context?.privacyProtected
		);

		return privacyProtected;
	}
}
