import express from 'express';
import { authenticateToken, authorizeStaff } from '../middleware/auth.js';
import Course from '../models/Course.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
    try {
        const courses = await Course.find();
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching courses' });
    }
});

router.post('/', authenticateToken, authorizeStaff, async (req, res) => {
    try {
        const { courseId, name, lecturer, credits, maxStudents } = req.body;

        const existingCourse = await Course.findOne({ courseId });
        if (existingCourse) {
            return res.status(400).json({ message: 'Course already exists' });
        }

        const course = new Course({
            courseId,
            name,
            lecturer,
            credits,
            maxStudents
        });

        await course.save();
        res.status(201).json({ message: 'Course created successfully', course });
    } catch (error) {
        res.status(500).json({ message: 'Error creating course' });
    }
});

export default router;