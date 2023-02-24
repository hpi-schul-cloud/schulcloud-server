describe('', () => {
	describe('isSchoolInMigration is called', () => {
		describe('when the migration is possible', () => {
			it('should return true', async () => {
				const { school, officialSchoolNumber } = setup();
				school.oauthMigrationPossible = new Date();

				schoolService.getSchoolBySchoolNumber.mockResolvedValue(school);

				const result: boolean = await service.isSchoolInMigration(officialSchoolNumber);

				expect(result).toEqual(true);
			});
		});

		describe('when the migration is mandatory', () => {
			it('should return true', async () => {
				const { school, officialSchoolNumber } = setup();
				school.oauthMigrationMandatory = new Date();

				schoolService.getSchoolBySchoolNumber.mockResolvedValue(school);

				const result: boolean = await service.isSchoolInMigration(officialSchoolNumber);

				expect(result).toEqual(true);
			});
		});

		describe('when there is no school with this official school number', () => {
			it('should return false', async () => {
				schoolService.getSchoolBySchoolNumber.mockResolvedValue(null);

				const result: boolean = await service.isSchoolInMigration('unknown number');

				expect(result).toEqual(false);
			});
		});
	});
});
