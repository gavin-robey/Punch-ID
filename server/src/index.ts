import express from 'express';
import authRouter from 'routes/auth';
import "src/db"; 
import * as dotenv from 'dotenv';

dotenv.config();
const app = express();
const PORT = process.env.PORT;

app.use(express.json()); // parse incoming JSON requests
app.use(express.urlencoded({ extended: false })); // parse incoming URL-encoded requests

// API routes
app.use("/auth", authRouter);

app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});