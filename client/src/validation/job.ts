import * as yup from "yup";

// mirrors server/src/validation/jobSchema.ts
export const newJobSchema = yup.object({
    name: yup.string().trim().required("Job name is required"),
});

export const newTaskSchema = yup.object({
    id: yup.string().required("Select a job site first"),
    punchId: yup.string().trim().required("Enter the Arrow QR code"),
    contentType: yup.string().oneOf(["media", "notes", "attachment"]).required("Choose a content type"),
    notes: yup.string().when("contentType", {
        is: "notes",
        then: (schema) => schema.trim().required("Notes are required"),
    }),
    name: yup.string().trim().required("Title is required"),
    description: yup.string(),
    dateDue: yup
        .string()
        .required("Due date is required")
        .matches(/^\d{4}-\d{2}-\d{2}$/, "Due date must be YYYY-MM-DD")
        .test("is-valid-date", "Due date must be a valid date", (value) => !!value && !isNaN(new Date(value).getTime())),
    visibility: yup.string().oneOf(["project", "template"]),
});
