import { Injectable } from "@nestjs/common";
import { ISubmissionStatus, Submission, Task } from "../entity";

@Injectable()
export class TaskSubmissionMetadataService {
    constructor() {}

    computeSubmissionMetadata = (taskSubmissions: Submission[], task: Task): ISubmissionStatus => {
        const submittedUsers = new Set();
        const gradedUsers = new Set();
    
        const sortedSubmissions = [...taskSubmissions].sort((a: Submission, b: Submission) => {
            if (a.createdAt > b.createdAt) {
                return 1;
            }
            return -1;
        });
    
        sortedSubmissions.forEach((submission) => {
            if (
                !submittedUsers.has(submission.student.id) &&
                (submission.grade || submission.gradeComment || submission.gradeFileIds)
            ) {
                gradedUsers.add(submission.student.id);
            }
            submittedUsers.add(submission.student.id);
        });
        // TODO: consider coursegroups
        const studentsInTasksCourse = task.course.students.length;
    
        return {
            submitted: submittedUsers.size,
            maxSubmissions: studentsInTasksCourse,
            graded: gradedUsers.size,
        };
    };
}

