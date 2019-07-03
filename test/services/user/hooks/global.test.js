const { expect } = require('chai');
const { mailToLowerCase } = require('../../../../src/services/user/hooks/global');

describe('global functions for user service', () => {
	describe('email to lowercase', () => {
		it('email, parent_mail, student_mail to lowercase', async () => {
			const hook = {
				data: {
					email: 'kdjafJhIKkli123@web.de',
					parent_email: 'k!UIo12ouUII@parent.de',
					student_email: 'Hans-Kunz.Henselmann@TraPanz.oRg',
				},
			};

			const mails = await mailToLowerCase(hook);

			expect(mails.data.email).to.equal(hook.data.email.toLowerCase());
			expect(mails.data.parent_email).to.equal(hook.data.parent_email.toLowerCase());
			expect(mails.data.student_email).to.equal(hook.data.student_email.toLowerCase());
		});
	});
});
