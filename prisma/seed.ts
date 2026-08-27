import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI environment variable is required");
  process.exit(1);
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

  const dsClass = await ClassModel.create({
    name: "Data Structures",
    department: "Computer Science",
    batch: "2024",
    schedule: "Wednesday 9:00 AM",
  });

  const studentsData = [
    { classId: seClass._id, students: [
      { rollNumber: "CS-2024-001", name: "Ahmed Khan", email: "ahmed.khan1@student.edu" },
      { rollNumber: "CS-2024-002", name: "Fatima Ali", email: "fatima.ali2@student.edu" },
      { rollNumber: "CS-2024-003", name: "Hassan Ahmed", email: "hassan.ahmed3@student.edu" },
      { rollNumber: "CS-2024-004", name: "Sara Malik", email: "sara.malik4@student.edu" },
      { rollNumber: "CS-2024-005", name: "Usman Raza", email: "usman.raza5@student.edu" },
    ]},
    { classId: aiClass._id, students: [
      { rollNumber: "AI-2025-001", name: "Ayesha Noor", email: "ayesha.noor1@student.edu" },
      { rollNumber: "AI-2025-002", name: "Bilal Shah", email: "bilal.shah2@student.edu" },
      { rollNumber: "AI-2025-003", name: "Cyra Ahmed", email: "cyra.ahmed3@student.edu" },
      { rollNumber: "AI-2025-004", name: "Danish Khan", email: "danish.khan4@student.edu" },
      { rollNumber: "AI-2025-005", name: "Emaan Tariq", email: "emaan.tariq5@student.edu" },
    ]},
    { classId: dsClass._id, students: [
      { rollNumber: "DS-2024-001", name: "Farhan Ali", email: "farhan.ali1@student.edu" },
      { rollNumber: "DS-2024-002", name: "Gulnaz Bibi", email: "gulnaz.bibi2@student.edu" },
      { rollNumber: "DS-2024-003", name: "Hamza Tariq", email: "hamza.tariq3@student.edu" },
      { rollNumber: "DS-2024-004", name: "Iqra Siddiqui", email: "iqra.siddiqui4@student.edu" },
      { rollNumber: "DS-2024-005", name: "Junaid Ahmed", email: "junaid.ahmed5@student.edu" },
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
        userId: String(user._id),
        email: s.email,
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
