import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Student from '../models/Student.js';
import Staff from '../models/Staff.js';

const router = express.Router();

// register student
router.post('/register/student', async (req, res) => {
    try {
        const { studentId, name, email, password, address, studyYear } = req.body;

        // check if student exists
        const existingStudent = await Student.findOne({
            $or: [{ email }, { studentId }]
        });

        if (existingStudent) {
            return res.status(400).json({ message: 'Student already exists' });
        }

        // hash password
        const hashPassword = await bcrypt.hash(password, 10);

        // create student
        const student = new Student({
            studentId,
            name,
            email,
            password: hashPassword,
            address,
            studyYear
        });

        await student.save();
        res.status(201).json({ message: 'Student registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error registering student' });
    }
});

// register staff
router.post('/register/staff', async (req, res) => {
    try { 
        const { staffId, name, email, password, address } = req.body;

        // check if staff exists
        const existingStaff = await Staff.findOne({
            $or: [{ email }, { staffId }]
        });

        if (existingStaff) {
            return res.status(400).json({ message: 'Staff already exists' });
        }

        // hash password
        const hashPassword = await bcrypt.hash(password, 10);

        // create staff
        const staff = new Staff({
            staffId,
            name,
            email,
            password: hashPassword,
            address
        });

        await staff.save();
        res.status(201).json({ message: 'Staff registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error registering staff' });
    }
});

// login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // check student
        let user = await Student.findOne({ email });
        let role = 'student';

        // if not student, check staff
        if (!user) {
            user = await Staff.findOne({ email });
            role = 'staff';
        }

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // gen token
        const token = jwt.sign(
            { id: user._id, email: user.email, role },
            process.env.JWT_SECRET,
            { expiresIn: '10m' }
        );

        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in' });
    }
});

export default router;