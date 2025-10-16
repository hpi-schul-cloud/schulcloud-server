import { ValidationError } from '@nestjs/common';
import { ApiValidationError } from '@shared/common/error';
import { getMetadataStorage } from 'class-validator';
import util from 'util';
import { Loggable } from '../../logger/interfaces';
import { ErrorLogMessage, LogMessageDataObject, ValidationErrorLogMessage } from '../../logger/types';
import { ErrorUtils } from '../utils/error.utils';

export class ErrorLoggable implements Loggable {
	readonly actualError: Error;

	constructor(private readonly error: unknown, private readonly data?: LogMessageDataObject) {
		if (this.error instanceof Error) {
			this.actualError = <Error>error;
		} else {
			this.actualError = new Error(util.inspect(error));
		}
	}

	private readonly classValidatorMetadataStorage = getMetadataStorage();

	getLogMessage(): ErrorLogMessage | ValidationErrorLogMessage {
		let logMessage: ErrorLogMessage | ValidationErrorLogMessage = {
			error: this.actualError,
			type: '',
			data: this.data,
		};

		if (this.actualError instanceof ApiValidationError) {
			logMessage = this.createLogMessageForValidationErrors(this.actualError);
		} else if (ErrorUtils.isFeathersError(this.actualError)) {
			logMessage.type = 'Feathers Error';
		} else if (ErrorUtils.isBusinessError(this.actualError)) {
			logMessage.type = 'Business Error';
		} else if (ErrorUtils.isNestHttpException(this.actualError)) {
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
