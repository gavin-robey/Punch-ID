// mirrors server/src/models/punchTask.ts
export type PunchStatus = 'Open' | 'In progress' | 'Complete' | 'Late';
export type ContentType = 'media' | 'notes' | 'attachment';
export type Visibility = 'project' | 'template';

export interface PunchTask {
    id: string;
    jobId: string;
    name: string;
    description?: string;
    contentType: ContentType;
    visibility: Visibility;
    media?: {
        url: string;
        id: string;
    };
    status: PunchStatus;
    notes: string[];
    dateDue: string;
    punchId: string;
    createdAt: string;
    updatedAt: string;
}
