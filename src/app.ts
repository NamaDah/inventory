import errorHandler from "./middleware/errorHandler";
import express from 'express';

const app = express();

// ... other app use()
app.use(errorHandler);