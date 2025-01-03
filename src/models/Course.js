import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    courseId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    lecturer: {
        type: String,
        required: true,
        trim: true
    },
    credits: {
        type: Number,
        required: true,
        min: 3,
        max: 5
    },
    maxStudents: {
        type: Number,
        required: true,
        min: 1
    },
    enrolledStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }],
    enrollmentCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

const Course = mongoose.model('Course', courseSchema);
export default Course;