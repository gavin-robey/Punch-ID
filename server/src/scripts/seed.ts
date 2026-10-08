/**
 * Seeds the database with 3 job sites, each with 10 punch tasks.
 *
 * Usage (from the server directory):
 *   npm run seed                      -> seeds jobs for the first user in the database
 *   npm run seed -- user@example.com  -> seeds jobs for that user
 */

import { connect, disconnect } from "mongoose";
import * as dotenv from "dotenv";
import JobModel from "src/models/job";
import PunchTaskModel, { ContentType, Status, Visibility } from "src/models/punchTask";
import UserModel from "src/models/user";

dotenv.config();

// public cloudinary demo assets, so seeded media resolves without uploading anything
const SAMPLE_MEDIA = {
    image: { url: "https://res.cloudinary.com/demo/image/upload/sample.jpg", id: "seed/sample-image" },
    video: { url: "https://res.cloudinary.com/demo/video/upload/dog.mp4", id: "seed/sample-video" },
    attachment: { url: "https://res.cloudinary.com/demo/image/upload/multi_page_pdf.pdf", id: "seed/sample-attachment" },
};

const JOB_SITES = [
    { name: "Riverside Apartments – Building A", rooms: ["Unit 101", "Unit 102", "Unit 204", "Lobby", "Stairwell B", "Unit 305", "Mail Room", "Unit 410", "Fitness Room", "Roof Deck"] },
    { name: "Oakwood Medical Office", rooms: ["Exam Room 1", "Exam Room 2", "Reception", "Waiting Area", "Break Room", "Lab", "Restroom 1", "Corridor 2", "Records Room", "Main Entrance"] },
    { name: "Maple Street Residence", rooms: ["Kitchen", "Living Room", "Master Bath", "Garage", "Hallway", "Laundry", "Guest Bedroom", "Basement", "Back Porch", "Office"] },
];

const TASK_TEMPLATES: {
    issue: string;
    description: string;
    contentType: ContentType;
    media?: keyof typeof SAMPLE_MEDIA;
    notes: string[];
}[] = [
    { issue: "Outlet", description: "Outlet cover plate cracked and not flush with the wall.", contentType: ContentType.MEDIA, media: "image", notes: ["Replace with white decora cover plate."] },
    { issue: "Light Switch", description: "Switch is wired to the wrong fixture.", contentType: ContentType.NOTES, notes: ["Swap leads so the switch controls the overhead light.", "Confirm with electrician before closing the box."] },
    { issue: "Paint Touch Up", description: "Scuffs and roller marks on the north wall.", contentType: ContentType.MEDIA, media: "image", notes: ["Use eggshell finish, color SW 7008."] },
    { issue: "Plumbing", description: "Slow drip from the supply line under the sink.", contentType: ContentType.MEDIA, media: "video", notes: ["Tighten the compression fitting, replace it if it still leaks."] },
    { issue: "Drywall Repair", description: "Nail pops along the ceiling seam.", contentType: ContentType.NOTES, notes: ["Reset the nails, mud and sand, then prime before painting."] },
    { issue: "Door Hardware", description: "Door latch does not catch the strike plate.", contentType: ContentType.ATTACHMENT, media: "attachment", notes: ["See the attached hardware spec sheet for the replacement strike."] },
    { issue: "Flooring", description: "Gap in the LVP transition strip at the doorway.", contentType: ContentType.MEDIA, media: "image", notes: ["Install a T-molding transition."] },
    { issue: "GFCI Outlet", description: "GFCI does not trip when tested.", contentType: ContentType.MEDIA, media: "video", notes: ["Replace the GFCI and retest every downstream outlet."] },
    { issue: "Trim Caulking", description: "Open joints between the baseboard and the wall.", contentType: ContentType.NOTES, notes: ["Caulk with paintable white silicone.", "Touch up the paint once cured."] },
    { issue: "Cabinet Alignment", description: "Upper cabinet doors are misaligned by about 1/4\".", contentType: ContentType.ATTACHMENT, media: "attachment", notes: ["Adjust the hinges per the manufacturer's install guide."] },
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
                contentType: template.contentType,
                visibility: taskIndex % 4 === 0 ? Visibility.TEMPLATE : Visibility.PROJECT,
                media: template.media ? SAMPLE_MEDIA[template.media] : undefined,
                status,
                notes: template.notes,
                dateDue,
                punchId: `PP-${jobIndex + 1}${`${taskIndex + 1}`.padStart(3, "0")}`,
            };
        });

        const created = await PunchTaskModel.insertMany(tasks);
        job.punchTasks.push(...created.map((task) => task._id));
        await job.save();

        owner.jobs.push(job._id);
        console.log(`  ✓ ${site.name}: ${created.length} punch tasks`);
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
