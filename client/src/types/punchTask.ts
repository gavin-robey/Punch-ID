// mirrors server/src/models/punchTask.ts
export type PunchStatus = 'Open' | 'In progress' | 'Complete' | 'Late';
export type MediaKind = 'image' | 'video';
export type Visibility = 'project' | 'template';

export interface MediaItem {
    url: string;
    id: string;
    kind: MediaKind;
}

export interface AttachmentItem {
    url: string;
    id: string;
    name: string;
    mimeType?: string;
}

export interface PunchTask {
    id: string;
    jobId: string;
    name: string;
    description?: string;
    visibility: Visibility;
    media: MediaItem[];
    attachments: AttachmentItem[];
    status: PunchStatus;
    notes: string[];
    dateDue: string;
    punchId: string;
    instructions: string[];
    createdAt: string;
    updatedAt: string;
}

// mirrors server/src/models/instruction.ts
export interface Instruction {
    id: string;
    taskId: string;
    title: string;
    note?: string;
    complete: boolean;
    status: PunchStatus;
    createdAt: string;
    updatedAt: string;
}
