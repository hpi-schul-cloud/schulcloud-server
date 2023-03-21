import { AccountMigrationInfoDto } from './account-migration-info.dto';

describe('AccountMigrationInfoDto', () => {
	it('Should create dto.', () => {
		const amount = 3;
		const infos = ['1', '2'];
		const errors = ['3'];

		const dto = new AccountMigrationInfoDto({
			amount,
			infos,
			errors,
		});

		expect(dto instanceof AccountMigrationInfoDto).toBe(true);
		expect(dto.amount).toStrictEqual(amount);
		expect(dto.infos).toStrictEqual(infos);
		expect(dto.errors).toStrictEqual(errors);
	});
});
