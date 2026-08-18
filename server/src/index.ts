import express, { ErrorRequestHandler } from 'express';
import authRouter from 'routes/auth';
import "src/db"; 
import * as dotenv from 'dotenv';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // parse incoming JSON requests
app.use(express.urlencoded({ extended: false })); // parse incoming URL-encoded requests
app.use(express.static('src/public'));

// API routes
app.use("/auth", authRouter);

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