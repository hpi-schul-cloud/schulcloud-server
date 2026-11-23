import { ErrorLoggable } from '@infra/error';
import { ApiValidationError } from '@shared/common/error';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateBoardImportJobBodyParams } from './create-board-import-job.body.params';

describe(CreateBoardImportJobBodyParams.name, () => {
	describe('when the link is not valid', () => {
		const setup = async () => {
			const link = 'http://user:secret-token@example.com/board';
			const bodyParams = plainToInstance(CreateBoardImportJobBodyParams, { link });
			const validationErrors = await validate(bodyParams);
			const errorLoggable = new ErrorLoggable(new ApiValidationError(validationErrors));

			return { link, errorLoggable };
		};

		it('should not log the link', async () => {
			const { link, errorLoggable } = await setup();

			const logMessage = errorLoggable.getLogMessage();

			expect(logMessage).toEqual(expect.objectContaining({ validationErrors: [expect.not.stringContaining(link)] }));
		});
	});
});
