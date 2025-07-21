import express from 'express';
import { protectAdmin } from '../middleware/auth.js';
import { requireAuth } from "@clerk/express";

import { getAllBookings, getAllShows, getDashboardData, isAdmin } from '../controllers/adminController.js';

const adminRouter=express.Router();

adminRouter.get('/is-admin',requireAuth(),protectAdmin,isAdmin);
adminRouter.get('/dashboard',protectAdmin,getDashboardData);
adminRouter.get('/all-shows',protectAdmin,getAllShows);
adminRouter.get('/all-bookings',protectAdmin,getAllBookings);

export default adminRouter;