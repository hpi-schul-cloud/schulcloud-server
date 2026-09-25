import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

export type AxiosMockAdapter = MockAdapter;

export const createAxiosMockAdapter = (): AxiosMockAdapter =>
	// axios-mock-adapter typings are incompatible with axios 1.20 under ts-jest.
	// once we update axios/ts-jest we can remove the `as any` cast.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/no-unsafe-argument
	new MockAdapter(axios as any);
