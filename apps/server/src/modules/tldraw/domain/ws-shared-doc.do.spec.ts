import { WsSharedDocDo } from './ws-shared-doc.do';

describe('WsSharedDocDo', () => {
	beforeAll(() => {
		jest.useFakeTimers();
	});

	describe('constructor', () => {
		describe('when constructor is called', () => {
			it('should create a new object with correct properties', () => {
				const doc = new WsSharedDocDo('docname');

				expect(doc).toBeInstanceOf(WsSharedDocDo);
				expect(doc.name).toEqual('docname');
				expect(doc.awarenessChannel).toEqual('docname-awareness');
				expect(doc.awareness).toBeDefined();
			});
		});
	});
});
