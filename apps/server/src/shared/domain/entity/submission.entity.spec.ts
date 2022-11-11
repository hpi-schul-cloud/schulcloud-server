import { MikroORM } from '@mikro-orm/core';
import { userFactory, taskFactory, submissionFactory, fileFactory, setupEntities } from '@shared/testing';

describe('Submission entity', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	// TODO: mock restore beforeEach

	describe('isSubmitted is called', () => {
		describe('when submission exists', () => {
			const setup = () => {
				const student = userFactory.buildWithId();
				const task = taskFactory.buildWithId();
				const submission = submissionFactory.buildWithId({ task, student });

				return submission;
			};

			it('should be return true.', () => {
				const submission = setup();

				expect(submission.isSubmitted()).toEqual(true);
			});
		});
	});

	describe('isSubmittedForUser is called', () => {
		describe('when submission exists and user is creator of the submission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId();
				const submission = submissionFactory.buildWithId({ task, student: user });

				return { submission, user };
			};

			it('should be return true.', () => {
				const { submission, user } = setup();

				expect(submission.isSubmittedForUser(user)).toEqual(true);
			});
		});

		describe('when submission exists and user is teamMember of the submission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId();
				const submission = submissionFactory.buildWithId({ task, teamMembers: [user] });

				return { submission, user };
			};

			it('should be return true.', () => {
				const { submission, user } = setup();

				expect(submission.isSubmittedForUser(user)).toEqual(true);
			});
		});

		describe('when submission exists and user is no member of the submission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId();
				const submission = submissionFactory.buildWithId({ task });

				return { submission, user };
			};

			it('should be return false.', () => {
				const { submission, user } = setup();

				expect(submission.isSubmittedForUser(user)).toEqual(false);
			});
		});
	});

	describe('isGraded is called', () => {
		describe('when no grades exists', () => {
			const setup = () => {
				const student = userFactory.buildWithId();
				const task = taskFactory.buildWithId();
				const submission = submissionFactory.buildWithId({ task, student });

				return submission;
			};

			it('should be return false.', () => {
				const submission = setup();

				expect(submission.isGraded()).toEqual(false);
			});
		});

		describe('when grade exists', () => {
			const setup = () => {
				const student = userFactory.buildWithId();
				const task = taskFactory.buildWithId();
				const grade = 50;
				const submission = submissionFactory.buildWithId({ task, student, grade });

				return submission;
			};

			it('should be return true.', () => {
				const submission = setup();

				expect(submission.isGraded()).toEqual(true);
			});
		});

		describe('when gradeComment exists', () => {
			const setup = () => {
				const student = userFactory.buildWithId();
				const task = taskFactory.buildWithId();
				const gradeComment = 'Very good!';
				const submission = submissionFactory.buildWithId({ task, student, gradeComment });

				return submission;
			};

			it('should be return true.', () => {
				const submission = setup();

				expect(submission.isGraded()).toEqual(true);
			});
		});

		describe('when gradeFiles exists', () => {
			const setup = () => {
				const student = userFactory.buildWithId();
				const task = taskFactory.buildWithId();
				const file = fileFactory.buildWithId();
				const gradeFiles = [file];
				const submission = submissionFactory.buildWithId({ task, student, gradeFiles });

				return submission;
			};

			it('should be return true.', () => {
				const submission = setup();

				expect(submission.isGraded()).toEqual(true);
			});
		});
	});

	describe('isGradedForUser is called', () => {
		describe('when grade exists and user is creator of the submission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId();
				const grade = 50;
				const submission = submissionFactory.buildWithId({ task, student: user, grade });

				return { submission, user };
			};

			it('should be return true.', () => {
				const { submission, user } = setup();

				expect(submission.isGradedForUser(user)).toEqual(true);
			});
		});

		describe('when grade exists and user is teamMember of the submission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId();
				const grade = 50;
				const submission = submissionFactory.buildWithId({ task, grade, teamMembers: [user] });

				return { submission, user };
			};

			it('should be return true.', () => {
				const { submission, user } = setup();

				expect(submission.isGradedForUser(user)).toEqual(true);
			});
		});

		describe('when grade exists and user is not a member of the submission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId();
				const grade = 50;
				const submission = submissionFactory.buildWithId({ task, grade });

				return { submission, user };
			};

			it('should be return false.', () => {
				const { submission, user } = setup();

				expect(submission.isGradedForUser(user)).toEqual(false);
			});
		});
	});

	describe('getMemberUserIds', () => {
		// TODO:
	});
});
