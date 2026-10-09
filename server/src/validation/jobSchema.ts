import * as yup from "yup";
import { Status, Visibility } from "src/models/punchTask";

export const newJobSchema = yup.object({
    name: yup
        .string()
        .required("Name is required")
});

// multipart fields only carry strings, so lists are sent as JSON and checked here
export const parseJsonArray = (value?: string) => {
    if(!value) return [];
    try{
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : null;
    }catch{
        return null;
    }
};

export const newTaskSchema = yup.object({
    id: yup
        .string()
        .required("Job Id is missing"),
    name: yup
        .string()
        .required("Job name is required"),
    dateDue: yup
        .string()
        .required('date is required')
        .matches(/^\d{4}-\d{2}-\d{2}$/, 'Must be a valid date format (YYYY-MM-DD)')
        .test('is-valid-date', 'Must be a valid date format', (value) => {
            if (!value) return false;
            const date = new Date(value);
            return !isNaN(date.getTime());
        }),
    description: yup
        .string(),
    visibility: yup
        .string()
        .oneOf(Object.values(Visibility), "Invalid visibility"),
    notes: yup
        .string()
        .test("notes-list", "Notes must be a list of text", (value) => {
            const notes = parseJsonArray(value);
            return notes !== null && notes.every((note) => typeof note === "string" && note.trim());
        }),
    instructions: yup
        .string()
        .test("instructions-list", "Every step needs a title", (value) => {
            const steps = parseJsonArray(value);
            return steps !== null && steps.every((step) => typeof step?.title === "string" && step.title.trim() && (step.note === undefined || typeof step.note === "string"));
        })
})

const dateString = yup
    .string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Must be a valid date format (YYYY-MM-DD)')
    .test('is-valid-date', 'Must be a valid date format', (value) => !value || !isNaN(new Date(value).getTime()));

export const updateTaskSchema = yup.object({
    name: yup.string(),
    description: yup.string(),
    status: yup
        .string()
        .oneOf(Object.values(Status), "Invalid status"),
    dateDue: dateString,
});

export const newInstructionSchema = yup.object({
    title: yup
        .string()
        .required("Title is required"),
    note: yup.string(),
});

export const updateInstructionSchema = yup.object({
    title: yup.string(),
    note: yup.string(),
    complete: yup.boolean(),
    status: yup
        .string()
        .oneOf(Object.values(Status), "Invalid status"),
});
