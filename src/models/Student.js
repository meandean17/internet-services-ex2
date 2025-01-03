import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
    studentId: {
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
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    studyYear: {
        type: Number,
        required: true,
        min: 1
    },
    enrolledCourses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    }],
    totalCredits: {
        type: Number,
        default: 0,
        max: 20
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// helper methods
studentSchema.methods.canRegisterForCourse = function (courseCredits) {
    return (this.totalCredits + courseCredits) <= 20;
};

studentSchema.methods.addCourse = function(course) {
    if (!this.enrolledCourses.includes(course._id)) {
        this.enrolledCourses.push(course._id);
        this.totalCredits += course.credits;
    }
};

studentSchema.methods.dropCourse = function(course) {
    const courseIndex = this.enrolledCourses.indexOf(course._id);
    if (courseIndex > -1) {
        this.enrolledCourses.splice(courseIndex, 1);
        this.totalCredits -= course.credits;
    }
};

const Student = mongoose.model('Student', studentSchema);
export default Student;