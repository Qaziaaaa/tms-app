import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/tms";

async function main() {
  await mongoose.connect(MONGODB_URI);
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
  }, { timestamps: true }));

  const ClassModel = mongoose.model("Class", new mongoose.Schema({
    name: String,
    department: String,
    batch: String,
    schedule: String,
  }, { timestamps: true }));

  const Student = mongoose.model("Student", new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    email: { type: String, default: null },
    rollNumber: String,
    name: String,
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
  }, { timestamps: true }));

  const passwordHash = await bcrypt.hash("password123", 10);

  const teacher = await User.create({
    name: "Teacher",
    email: "teacher@tms.edu",
    passwordHash,
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

  const irClass = await ClassModel.create({
    name: "International Relations",
    department: "Humanities",
    batch: "2026",
    schedule: "Wednesday 9:00 AM",
  });

  const studentsData = [
    { classId: seClass._id, students: [
      { rollNumber: "CS-24-001", name: "Ahmed Khan", email: "ahmed@student.edu" },
      { rollNumber: "CS-24-002", name: "Fatima Ali", email: "fatima@student.edu" },
      { rollNumber: "CS-24-003", name: "Hassan Ahmed", email: "hassan@student.edu" },
      { rollNumber: "CS-24-004", name: "Sara Malik", email: "sara@student.edu" },
      { rollNumber: "CS-24-005", name: "Usman Raza", email: "usman@student.edu" },
    ]},
    { classId: aiClass._id, students: [
      { rollNumber: "AI-25-001", name: "Ayesha Noor", email: "ayesha@student.edu" },
      { rollNumber: "AI-25-002", name: "Bilal Shah", email: "bilal@student.edu" },
      { rollNumber: "AI-25-003", name: "Cyra Ahmed", email: "cyra@student.edu" },
      { rollNumber: "AI-25-004", name: "Danish Khan", email: "danish@student.edu" },
      { rollNumber: "AI-25-005", name: "Emaan Tariq", email: "emaan@student.edu" },
    ]},
    { classId: irClass._id, students: [
      { rollNumber: "IR-26-001", name: "Farhan Ali", email: "farhan@student.edu" },
      { rollNumber: "IR-26-002", name: "Gulnaz Bibi", email: "gulnaz@student.edu" },
      { rollNumber: "IR-26-003", name: "Hamza Tariq", email: "hamza@student.edu" },
      { rollNumber: "IR-26-004", name: "Iqra Siddiqui", email: "iqra@student.edu" },
      { rollNumber: "IR-26-005", name: "Junaid Ahmed", email: "junaid@student.edu" },
    ]},
  ];

  let studentCount = 0;
  for (const { classId, students } of studentsData) {
    for (const s of students) {
      const user = await User.create({
        name: s.name,
        email: s.email,
        passwordHash,
        role: "student",
      });
      await Student.create({
        rollNumber: s.rollNumber,
        name: s.name,
        classId,
        userId: user._id,
        email: s.email,
      });
      studentCount++;
    }
  }

  console.log(`Seed complete: 1 teacher (${teacher._id}), ${studentCount} students, 3 classes`);
  console.log("Teacher login: teacher@tms.edu / password123");
  console.log("Student login: ahmed@student.edu / password123");
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
