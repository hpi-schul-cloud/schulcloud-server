const { equal: equalIds } = require('../../../helper/compare').ObjectId;

const getAverageRating = function getAverageRating(submissions) {
	// Durchschnittsnote berechnen
	if (submissions.length > 0) {
		// Nur bewertete Abgaben einbeziehen
		const submissiongrades = submissions.filter((s) => Number.isInteger(s.grade));
		// Abgabe für jedes Teammitglied einzeln werten
		let numSubmissions = 0;
		let gradeSum = 0;
		submissiongrades.forEach((e) => {
			if (e.courseGroupId && (e.courseGroupId.userIds || []) > 0) {
				numSubmissions += e.courseGroupId.userIds.length;
				gradeSum += (e.courseGroupId.userIds * e.grade);
			} else if (e.teamMembers && e.teamMembers.length > 0) {
				numSubmissions += e.teamMembers.length;
				gradeSum += (e.teamMembers.length * e.grade);
			} else {
				numSubmissions += 1;
				gradeSum += e.grade;
			}
		});

		// Abgaben vorhanden?
		if (numSubmissions > 0) {
			// Durchschnittsnote berechnen
			return (gradeSum / numSubmissions).toFixed(2);
		}
	}
	return undefined;
};
function isValidSubmission(submission) {
	return (submission.comment && submission.comment !== '')
        || (submission.fileIds && submission.fileIds.length > 0);
}
function isGraded(submission) {
	return (submission.gradeComment && submission.gradeComment !== '')
        || (submission.grade && Number.isInteger(submission.grade));
}
function isTeacher(userId, homework) {
	const user = userId.toString();
	let isTeacherCheck = equalIds(homework.teacherId, userId);
	if (!isTeacherCheck && !homework.private) {
		const isCourseTeacher = (homework.courseId.teacherIds || []).includes(user);
		const isCourseSubstitution = (homework.courseId.substitutionIds || []).includes(user);
		isTeacherCheck = isCourseTeacher || isCourseSubstitution;
	}
	return isTeacherCheck;
}

module.exports = {
	isTeacher,
	isGraded,
	isValidSubmission,
	getAverageRating,
};
