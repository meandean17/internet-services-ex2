import express from "express";
import {
  authenticateToken,
  authorizeStaff,
  authorizeStudent,
} from "../middleware/auth.js";
import Course from "../models/Course.js";
import Student from "../models/Student.js";

const router = express.Router();

// staff authentication for course management
// get all courses
router.get("/", authenticateToken, async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: "Error fetching courses" });
  }
});

router.post("/", authenticateToken, authorizeStaff, async (req, res) => {
  try {
    const { courseId, name, lecturer, credits, maxStudents } = req.body;

    const existingCourse = await Course.findOne({ courseId });
    if (existingCourse) {
      return res.status(400).json({ message: "Course already exists" });
    }

    if (credits < 3 || credits > 5) {
      return res
        .status(400)
        .json({ message: "Credits must be between 3 and 5" });
    }

    if (maxStudents < 1) {
      return res
        .status(400)
        .json({ message: "Max students must be at least 1" });
    }

    if (!courseId || !name || !lecturer || !credits || !maxStudents) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const course = new Course({
      courseId,
      name,
      lecturer,
      credits,
      maxStudents,
    });

    await course.save();
    res.status(201).json({ message: "Course created successfully", course });
  } catch (error) {
    res.status(500).json({ message: "Error creating course" });
  }
});

// update course - staff only
router.put(
  "/:courseId",
  authenticateToken,
  authorizeStaff,
  async (req, res) => {
    try {
      const { name, lecturer, credits, maxStudents } = req.body;
      const course = await Course.findOne({ courseId: req.params.courseId });

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // update details
      if (credits && (credits < 3 || credits > 5)) {
        return res
          .status(400)
          .json({ message: "Credits must be between 3 and 5" });
      }

      if (maxStudents && maxStudents < 1) {
        return res
          .status(400)
          .json({ message: "Max students must be at least 1" });
      }

      if (!name && !lecturer && !credits && !maxStudents) {
        return res.status(400).json({ message: "No changes submitted" });
      }

      if (course.enrollmentCount > maxStudents) {
        return res.status(400).json({
          message: "Max students cannot be less than enrollment count",
        });
      }

      course.name = name || course.name;
      course.lecturer = lecturer || course.lecturer;
      course.credits = credits || course.credits;
      course.maxStudents = maxStudents || course.maxStudents;

      await course.save();
      res.json({ message: "Course updated successfully", course });
    } catch (error) {
      res.status(500).json({ message: "Error updating course" });
    }
  }
);

// delete course - staff only
router.delete(
  "/:courseId",
  authenticateToken,
  authorizeStaff,
  async (req, res) => {
    try {
      const course = await Course.findOne({ courseId: req.params.courseId });

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // check if students are enrolled
      if (course.enrollmentCount > 0) {
        return res
          .status(400)
          .json({ message: "Cannot delete course with enrolled students" });
      }

      await course.deleteOne({ _id: course._id });
      res.json({ message: "Course deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting course" });
    }
  }
);

// get enrollment status - staff only
router.get(
  "/:courseId/status",
  authenticateToken,
  authorizeStaff,
  async (req, res) => {
    try {
      const course = await Course.findOne({
        courseId: req.params.courseId,
      }).populate("enrolledStudents", "studentId name email");

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      res.json({
        courseId: course.courseId,
        name: course.name,
        enrollmentCount: course.enrollmentCount,
        maxStudents: course.maxStudents,
        enrolledStudents: course.enrolledStudents,
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching course status" });
    }
  }
);

//*** student routes ***//
// get avail courses - student only
router.get(
  "/available",
  authenticateToken,
  authorizeStudent,
  async (req, res) => {
    try {
      const courses = await Course.find({
        enrollmentCount: { $lt: "$maxStudents" }, // only show courses not maxed out
      });

      if (!courses) {
        return res.status(404).json({ message: "No available courses" });
      }
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Error fetching available courses" });
    }
  }
);

// course registration - student only
router.post(
  "/:courseId/register",
  authenticateToken,
  authorizeStudent,
  async (req, res) => {
    try {
      const course = await Course.findOne({ courseId: req.params.courseId });

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // check if course is full
      if (course.enrollmentCount >= course.maxStudents) {
        return res.status(400).json({ message: "Course is full" });
      }

      // get students total credits
      const student = await Student.findById(req.user.id);

      // check if registered
      if (student.enrolledCourses.includes(course._id)) {
        return res
          .status(400)
          .json({ message: "Already registered for this course" });
      }

      // check credit limit using helper method
      if (!student.canRegisterForCourse(course.credits)) {
        return res.status(400).json({
          message:
            "Cannot register: Would exceed max credit limit of 20. Please drop a course first",
        });
      }

      // add student to course usin helper method
      student.addCourse(course);
      await student.save();

      // update course enrollment
      course.enrolledStudents.push(student._id);
      course.enrollmentCount += 1;
      await course.save();

      res.json({
        message: "Successfully registered for course: ",
        courseId: req.params.courseId,
        currentCredits: student.totalCredits,
      });
    } catch (error) {
      res.status(500).json({ message: "Error registering for course" });
    }
  }
);

// drop a course - student only
router.delete(
  "/:courseId/register",
  authenticateToken,
  authorizeStudent,
  async (req, res) => {
    try {
      const course = await Course.findOne({ courseId: req.params.courseId });

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // get student
      const student = await Student.findById(req.user.id);

      // check if registered
      if (!course.enrolledStudents.includes(req.user.id)) {
        return res
          .status(400)
          .json({ message: "Not registered for this course" });
      }

      // drop course using helper method
      student.dropCourse(course);
      await student.save();

      // update course enrollment
      course.enrolledStudents = course.enrolledStudents.filter(
        (studentId) => studentId.toString() !== req.user.id
      );
      course.enrollmentCount -= 1;
      await course.save();

      res.json({
        message: "Successfully dropped course: ",
        courseId: req.params.courseId,
        currentCredits: student.totalCredits,
      });
    } catch (error) {
      res.status(500).json({ message: "Error dropping course" });
    }
  }
);

// get student courses - student only
router.get(
  "/my-courses",
  authenticateToken,
  authorizeStudent,
  async (req, res) => {
    try {
      const student = await Student.findById(req.user.id).populate(
        "enrolledCourses"
      );

      res.json({
        courses: student.enrolledCourses,
        totalCredits: student.totalCredits,
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching courses" });
    }
  }
);

export default router;
