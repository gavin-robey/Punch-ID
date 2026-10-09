/**
 * Seeds the database with 3 job sites, each with 10 punch tasks that have 3-5 instruction steps.
 *
 * Usage (from the server directory):
 *   npm run seed                      -> seeds jobs for the first user in the database
 *   npm run seed -- user@example.com  -> seeds jobs for that user
 */

import { connect, disconnect } from "mongoose";
import * as dotenv from "dotenv";
import JobModel from "src/models/job";
import PunchTaskModel, { MediaKind, Status, Visibility } from "src/models/punchTask";
import UserModel from "src/models/user";
import InstructionModel from "src/models/instruction";

dotenv.config();

// public cloudinary demo assets, so seeded media resolves without uploading anything
const SAMPLE_MEDIA = {
    image: { url: "https://res.cloudinary.com/demo/image/upload/sample.jpg", id: "seed/sample-image", kind: MediaKind.IMAGE },
    video: { url: "https://res.cloudinary.com/demo/video/upload/dog.mp4", id: "seed/sample-video", kind: MediaKind.VIDEO },
};
const SAMPLE_ATTACHMENT = { url: "https://res.cloudinary.com/demo/image/upload/multi_page_pdf.pdf", id: "seed/sample-attachment", name: "Spec Sheet.pdf", mimeType: "application/pdf" };

const JOB_SITES = [
    { name: "Riverside Apartments – Building A", rooms: ["Unit 101", "Unit 102", "Unit 204", "Lobby", "Stairwell B", "Unit 305", "Mail Room", "Unit 410", "Fitness Room", "Roof Deck"] },
    { name: "Oakwood Medical Office", rooms: ["Exam Room 1", "Exam Room 2", "Reception", "Waiting Area", "Break Room", "Lab", "Restroom 1", "Corridor 2", "Records Room", "Main Entrance"] },
    { name: "Maple Street Residence", rooms: ["Kitchen", "Living Room", "Master Bath", "Garage", "Hallway", "Laundry", "Guest Bedroom", "Basement", "Back Porch", "Office"] },
];

const TASK_TEMPLATES: {
    issue: string;
    description: string;
    media: (keyof typeof SAMPLE_MEDIA)[];
    attachment?: boolean;
    notes: string[];
    steps: { title: string; note: string }[];
}[] = [
    { issue: "Outlet", description: "Outlet cover plate cracked and not flush with the wall.", media: ["image"], notes: ["Replace with white decora cover plate."], steps: [{ title: "Verify Outlet Type", note: "Confirm standard duplex 120V" }, { title: "Install Cover Plate", note: "Install white duplex cover plate" }, { title: "Secure Screws", note: "Tighten screws and ensure plate is secure" }, { title: "Inspect Work", note: "Verify alignment and finish" }, { title: "Take Photo", note: "Upload photo of completed work" }] },
    { issue: "Light Switch", description: "Switch is wired to the wrong fixture.", media: [], notes: ["Swap leads so the switch controls the overhead light.", "Confirm with electrician before closing the box."], steps: [{ title: "Shut Off Breaker", note: "Kill power at the panel and verify with a tester" }, { title: "Swap Leads", note: "Move the load wire to the correct fixture" }, { title: "Test Fixture", note: "Confirm the switch controls the overhead light" }] },
    { issue: "Paint Touch Up", description: "Scuffs and roller marks on the north wall.", media: ["image"], notes: ["Use eggshell finish, color SW 7008."], steps: [{ title: "Clean Surface", note: "Wipe the wall down and let it dry" }, { title: "Apply Paint", note: "Roll one coat of SW 7008 eggshell" }, { title: "Inspect Finish", note: "Check for roller marks in raking light" }, { title: "Take Photo", note: "Upload photo of completed work" }] },
    { issue: "Plumbing", description: "Slow drip from the supply line under the sink.", media: ["video", "image"], notes: ["Tighten the compression fitting, replace it if it still leaks."], steps: [{ title: "Shut Off Supply", note: "Close the angle stop under the sink" }, { title: "Tighten Fitting", note: "Snug the compression nut a quarter turn" }, { title: "Leak Test", note: "Open the supply and check for drips after 10 minutes" }] },
    { issue: "Drywall Repair", description: "Nail pops along the ceiling seam.", media: [], notes: ["Reset the nails, mud and sand, then prime before painting."], steps: [{ title: "Reset Nails", note: "Drive popped nails and add a screw beside each" }, { title: "Mud And Sand", note: "Apply two coats of compound and sand smooth" }, { title: "Prime", note: "Spot prime the repaired areas" }, { title: "Paint", note: "Paint to match the ceiling" }] },
    { issue: "Door Hardware", description: "Door latch does not catch the strike plate.", media: ["image"], attachment: true, notes: ["See the attached hardware spec sheet for the replacement strike."], steps: [{ title: "Check Strike Alignment", note: "Mark where the latch meets the strike" }, { title: "Adjust Strike Plate", note: "Move or file the strike so the latch catches" }, { title: "Test Latch", note: "Close the door 5 times and confirm it latches" }] },
    { issue: "Flooring", description: "Gap in the LVP transition strip at the doorway.", media: ["image"], notes: ["Install a T-molding transition."], steps: [{ title: "Measure Gap", note: "Measure the doorway gap width" }, { title: "Cut T-Molding", note: "Cut the transition strip to length" }, { title: "Install Transition", note: "Set the track and snap in the T-molding" }, { title: "Inspect Work", note: "Confirm the strip is flush and secure" }] },
    { issue: "GFCI Outlet", description: "GFCI does not trip when tested.", media: ["video", "image"], notes: ["Replace the GFCI and retest every downstream outlet."], steps: [{ title: "Shut Off Breaker", note: "Kill power and verify with a tester" }, { title: "Replace GFCI", note: "Install a new GFCI with line/load wired correctly" }, { title: "Test Trip", note: "Press test and confirm the device trips" }, { title: "Test Downstream", note: "Verify each downstream outlet loses power on trip" }, { title: "Take Photo", note: "Upload photo of completed work" }] },
    { issue: "Trim Caulking", description: "Open joints between the baseboard and the wall.", media: [], notes: ["Caulk with paintable white silicone.", "Touch up the paint once cured."], steps: [{ title: "Clean Joints", note: "Remove dust and old caulk" }, { title: "Caulk Joints", note: "Run a bead of paintable white silicone" }, { title: "Touch Up Paint", note: "Paint once the caulk has cured" }] },
    { issue: "Cabinet Alignment", description: "Upper cabinet doors are misaligned by about 1/4\".", media: ["image"], attachment: true, notes: ["Adjust the hinges per the manufacturer's install guide."], steps: [{ title: "Check Hinges", note: "Identify which hinges are out of adjustment" }, { title: "Adjust Hinges", note: "Use the side and depth screws to align the doors" }, { title: "Verify Gaps", note: "Confirm even 1/8\" reveals between doors" }] },
];

const STATUSES = Object.values(Status);

// spreads due dates from 10 days ago to 35 days out; overdue tasks that are not complete are marked late
const dueDateFor = (index: number) => new Date(Date.now() + (index * 5 - 10) * 24 * 60 * 60 * 1000);

const getOwner = async (email?: string) => {
    if(email) return UserModel.findOne({ email });
    return UserModel.findOne().sort({ createdAt: 1 });
};

const seed = async () => {
    const uri = process.env.URI;
    if(!uri) throw new Error("URI is missing from server/.env");

    await connect(uri);
    console.log("Connected to MongoDB");

    const email = process.argv[2];
    const owner = await getOwner(email);
    if(!owner) throw new Error(email ? `No user found with email ${email}` : "No users in the database, sign up first");

    console.log(`Seeding jobs for ${owner.name} (${owner.email})`);

    for(const [jobIndex, site] of JOB_SITES.entries()){
        const job = await JobModel.create({ owner: owner._id as any, name: site.name, punchTasks: [] });

        const tasks = TASK_TEMPLATES.map((template, taskIndex) => {
            const dateDue = dueDateFor(taskIndex);
            const isOverdue = dateDue.getTime() < Date.now();
            const status = isOverdue && taskIndex % 2 === 0 ? Status.LATE : STATUSES[(taskIndex + jobIndex) % STATUSES.length];

            return {
                jobId: job._id as any,
                name: `${site.rooms[taskIndex]} – ${template.issue}`,
                description: template.description,
                visibility: taskIndex % 4 === 0 ? Visibility.TEMPLATE : Visibility.PROJECT,
                media: template.media.map((kind) => SAMPLE_MEDIA[kind]),
                attachments: template.attachment ? [SAMPLE_ATTACHMENT] : [],
                status,
                notes: template.notes,
                dateDue,
                punchId: `PP-${jobIndex + 1}${`${taskIndex + 1}`.padStart(3, "0")}`,
            };
        });

        const created = await PunchTaskModel.insertMany(tasks);
        job.punchTasks.push(...created.map((task) => task._id));
        await job.save();

        // instruction steps: completed tasks have every step done, in progress tasks have the first half done
        let stepCount = 0;
        for(const [taskIndex, task] of created.entries()){
            const steps = TASK_TEMPLATES[taskIndex].steps;
            const doneCount = task.status === Status.COMPLETE ? steps.length : task.status === Status.INPROGRESS ? Math.floor(steps.length / 2) : 0;

            const instructions = await InstructionModel.insertMany(steps.map((step, stepIndex) => ({
                taskId: task._id as any,
                title: step.title,
                note: step.note,
                complete: stepIndex < doneCount,
                status: stepIndex < doneCount ? Status.COMPLETE : Status.STARTED,
            })));

            task.instructions = instructions.map((instruction) => instruction._id);
            await task.save();
            stepCount += instructions.length;
        }

        owner.jobs.push(job._id);
        console.log(`  ✓ ${site.name}: ${created.length} punch tasks, ${stepCount} instruction steps`);
    }

    await owner.save();
    console.log("Seeding complete");
};

seed()
    .catch((err) => {
        console.error("Seeding failed:", err.message ?? err);
        process.exitCode = 1;
    })
    .finally(() => disconnect());
