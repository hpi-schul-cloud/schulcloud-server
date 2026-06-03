import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ErwinKlassePayload } from './erwin.klasse.payload';

describe('ErwinKlassePayload', () => {
	describe('when valid data is provided', () => {
		const setup = () => {
			const payload = plainToInstance(ErwinKlassePayload, {
				externalId: 'ext-123',
				erwinId: 'erwin-456',
				name: 'Klasse 5a',
			});

			return { payload };
		};

		it('should pass validation', async () => {
			const { payload } = setup();

			const errors = await validate(payload);

			expect(errors).toHaveLength(0);
		});
	});

	describe('when externalId is missing', () => {
		const setup = () => {
			const payload = plainToInstance(ErwinKlassePayload, {
				erwinId: 'erwin-456',
				name: 'Klasse 5a',
			});

			return { payload };
		};

		it('should fail validation', async () => {
			const { payload } = setup();

			const errors = await validate(payload);

			expect(errors).toHaveLength(1);
			expect(errors[0].property).toBe('externalId');
		});
	});

	describe('when erwinId is missing', () => {
		const setup = () => {
			const payload = plainToInstance(ErwinKlassePayload, {
				externalId: 'ext-123',
				name: 'Klasse 5a',
			});

			return { payload };
		};

		it('should fail validation', async () => {
			const { payload } = setup();

			const errors = await validate(payload);

			expect(errors).toHaveLength(1);
			expect(errors[0].property).toBe('erwinId');
		});
	});

	describe('when name is missing', () => {
		const setup = () => {
			const payload = plainToInstance(ErwinKlassePayload, {
				externalId: 'ext-123',
				erwinId: 'erwin-456',
			});

			return { payload };
		};

		it('should fail validation', async () => {
			const { payload } = setup();

			const errors = await validate(payload);

			expect(errors).toHaveLength(1);
			expect(errors[0].property).toBe('name');
		});
	});

	describe('when externalId is empty string', () => {
		const setup = () => {
			const payload = plainToInstance(ErwinKlassePayload, {
				externalId: '',
				erwinId: 'erwin-456',
				name: 'Klasse 5a',
			});

			return { payload };
		};

		it('should fail validation', async () => {
			const { payload } = setup();

			const errors = await validate(payload);

			expect(errors.some((e) => e.property === 'externalId')).toBe(true);
		});
	});
});
