import express, { ErrorRequestHandler } from 'express';
import cors from 'cors';
import authRouter from 'routes/auth';
import "src/db"; 
import * as dotenv from 'dotenv';
import jobRouter from './routes/job';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const CORS_URL = process.env.CORS_URL || 'http://localhost:8081';

// must come before the routes so the browser's OPTIONS preflight gets the CORS headers
app.use(cors({
    origin: CORS_URL.split(',').map((url) => url.trim()),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
}));

app.use(express.json()); // parse incoming JSON requests
app.use(express.urlencoded({ extended: false })); // parse incoming URL-encoded requests
app.use(express.static('src/public'));

// API routes
app.use("/auth", authRouter);
app.use("/job", jobRouter);

// error handling middleware
const errorHandler: ErrorRequestHandler = (err, req, res, next) => { 
    console.error(err.stack);
    res.status(500).json({
        message: err.message || "Internal Server Error" 
    });
}

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});