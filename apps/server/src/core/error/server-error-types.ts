/**
 * all errors defined in the application require a definition,
 * implementing the @IErrorType where their type is unambigious within of the application.
 *  */

import legacyErrorTypes = require('../../../../../src/errors/commonErrorTypes');
import { IErrorType } from './interface/error-type.interface';

// check legacy error typing is matching IErrorType
const serverErrorTypes: { [index: string]: IErrorType } = legacyErrorTypes;

// re-use legacy error types
export const { INTERNAL_SERVER_ERROR_TYPE, ASSERTION_ERROR_TYPE, API_VALIDATION_ERROR_TYPE, FORBIDDEN_ERROR_TYPE } =
	serverErrorTypes;

// further error types

export const NOT_FOUND_ERROR_TYPE: IErrorType = {
	type: 'NOT_FOUND_ERROR',
	title: 'Not Found',
	defaultMessage: 'The requested ressource has not been found.',
};
