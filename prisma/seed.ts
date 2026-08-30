import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI environment variable is required");
  process.exit(1);
}

const INITIAL_STUDENT_PASSWORD = "student123";

function generateEmail(name: string, rollNumber: string): string {
  const first = name.split(" ")[0].toLowerCase().replace(/[^a-z]/g, "");
  const suffix = rollNumber.replace(/[^0-9]/g, "").slice(-3);
  return `${first}${suffix}@uop.edu`;
}

async function main() {
  await mongoose.connect(MONGODB_URI!);
  console.log("Connected to MongoDB, clearing all collections...");

  const collections = await mongoose.connection.db!.listCollections().toArray();
  for (const col of collections) {
    await mongoose.connection.db!.dropCollection(col.name);
  }
  console.log("All collections dropped");

  const User = mongoose.model("User", new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, lowercase: true, trim: true },
    passwordHash: String,
    role: { type: String, enum: ["teacher", "student"], default: "teacher" },
    mustChangePassword: { type: Boolean, default: false },
  }, { timestamps: true }));

  const ClassModel = mongoose.model("Class", new mongoose.Schema({
    name: String,
    department: String,
    batch: String,
    schedule: String,
  }, { timestamps: true }));

  const Student = mongoose.model("Student", new mongoose.Schema({
    userId: { type: String, default: null },
    email: { type: String, default: null, lowercase: true, trim: true },
    rollNumber: String,
    name: String,
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
  }, { timestamps: true }));

  const teacherPwHash = await bcrypt.hash("password123", 10);
  const studentPwHash = await bcrypt.hash(INITIAL_STUDENT_PASSWORD, 10);

  const teacher = await User.create({
    name: "Teacher",
    email: "teacher@tms.edu",
    passwordHash: teacherPwHash,
    role: "teacher",
  });
  console.log("Created teacher:", teacher.email, "id:", teacher._id);

  const seClass = await ClassModel.create({
    name: "Software Engineering",
    department: "Computer Science",
    batch: "2024",
    schedule: "Monday 10:00 AM",
  });

  const aiClass = await ClassModel.create({
    name: "Artificial Intelligence",
    department: "Computer Science",
    batch: "2025",
    schedule: "Tuesday 2:00 PM",
  });

  const dsClass = await ClassModel.create({
    name: "Data Structures",
    department: "Computer Science",
    batch: "2024",
    schedule: "Wednesday 9:00 AM",
  });

  const studentsData = [
    { classId: seClass._id, students: [
      { rollNumber: "SE-01-01", name: "Ahmed Khan" },
      { rollNumber: "SE-01-02", name: "Fatima Ali" },
      { rollNumber: "SE-01-03", name: "Hassan Ahmed" },
      { rollNumber: "SE-01-04", name: "Sara Malik" },
      { rollNumber: "SE-01-05", name: "Usman Raza" },
    ]},
    { classId: aiClass._id, students: [
      { rollNumber: "AI-02-01", name: "Ayesha Noor" },
      { rollNumber: "AI-02-02", name: "Bilal Shah" },
      { rollNumber: "AI-02-03", name: "Cyra Ahmed" },
      { rollNumber: "AI-02-04", name: "Danish Khan" },
      { rollNumber: "AI-02-05", name: "Emaan Tariq" },
    ]},
    { classId: dsClass._id, students: [
      { rollNumber: "DS-03-01", name: "Farhan Ali" },
      { rollNumber: "DS-03-02", name: "Gulnaz Bibi" },
      { rollNumber: "DS-03-03", name: "Hamza Tariq" },
      { rollNumber: "DS-03-04", name: "Iqra Siddiqui" },
      { rollNumber: "DS-03-05", name: "Junaid Ahmed" },
    ]},
  ];

  let studentCount = 0;
  const usedEmails = new Set<string>();

  for (const { classId, students } of studentsData) {
    for (const s of students) {
      let email = generateEmail(s.name, s.rollNumber);
      let counter = 1;
      while (usedEmails.has(email)) {
        const first = s.name.split(" ")[0].toLowerCase().replace(/[^a-z]/g, "");
        const suffix = s.rollNumber.replace(/[^0-9]/g, "").slice(-3);
        email = `${first}${counter}${suffix}@uop.edu`;
        counter++;
      }
      usedEmails.add(email);

      const user = await User.create({
        name: s.name,
        email,
        passwordHash: studentPwHash,
        role: "student",
        mustChangePassword: true,
      });
      await Student.create({
        rollNumber: s.rollNumber,
        name: s.name,
        classId,
        userId: String(user._id),
        email,
      });
      studentCount++;
    }
  }

  console.log(`Seed complete: 1 teacher (${teacher._id}), ${studentCount} students, 3 classes`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
