import { ErrorLogMessage } from '@core/logger';
import { H5pEditorEvents } from '@infra/h5p-editor-client';
import { h5pEditorExchangeCopyContentParamsFactory } from '@infra/h5p-editor-client/testing';
import { H5pEditorExchangeInvalidParamsLoggableException } from './h5p-editor-exchange-invalid-params.loggable-exception';

describe(H5pEditorExchangeInvalidParamsLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const exchangeEvent = H5pEditorEvents.COPY_CONTENT;
			const params = h5pEditorExchangeCopyContentParamsFactory.build();

			const loggable = new H5pEditorExchangeInvalidParamsLoggableException(exchangeEvent, params);

			return { loggable, exchangeEvent, params };
		};

		it('should return the correct log message', () => {
			const { loggable, exchangeEvent, params } = setup();

			const result = loggable.getLogMessage();

			expect(result).toEqual<ErrorLogMessage>({
				type: 'H5P_EDITOR_EXCHANGE_INVALID_PARAMS',
				stack: loggable.stack,
				data: {
					exchangeEvent: exchangeEvent.valueOf(),
					params: JSON.stringify(params),
				},
			});
		});
	});
});
