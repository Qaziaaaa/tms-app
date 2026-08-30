import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const TEST_DB_NAME = "tms_test";

function getTestDbUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI must be set for tests. " +
      "In CI this is provided via workflow env. " +
      "Locally: MONGODB_URI=mongodb://localhost:27017/?replicaSet=rs0 npx playwright test"
    );
  }

  const parsed = new URL(uri);
  if (!parsed.protocol.startsWith("mongodb")) {
    throw new Error("MONGODB_URI must use mongodb:// or mongodb+srv:// protocol");
  }

  parsed.pathname = `/${TEST_DB_NAME}`;
  return parsed.toString();
}

const MONGODB_URI = getTestDbUri();

const STUDENTS_PER_CLASS = 5;

export default async function globalSetup() {
  console.log(`Connecting to test DB: ${MONGODB_URI.replace(/\/\/[^@]*@/, "//<credentials>@")}`);
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db!;

  const collections = await db.listCollections().toArray();
  for (const col of collections) {
    await db.dropCollection(col.name);
  }

  const User = mongoose.model(
    "User",
    new mongoose.Schema(
      {
        name: String,
        email: { type: String, unique: true, lowercase: true, trim: true },
        passwordHash: String,
        role: { type: String, enum: ["teacher", "student"], default: "teacher" },
        mustChangePassword: { type: Boolean, default: false },
      },
      { timestamps: true }
    )
  );

  const ClassModel = mongoose.model(
    "Class",
    new mongoose.Schema(
      { name: String, department: String, batch: String, schedule: String },
      { timestamps: true }
    )
  );

  const StudentModel = mongoose.model(
    "Student",
    new mongoose.Schema(
      {
        userId: { type: String, default: null },
        email: { type: String, default: null, lowercase: true, trim: true },
        rollNumber: String,
        name: String,
        classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
      },
      { timestamps: true }
    )
  );

  const teacherHash = await bcrypt.hash("password123", 10);
  const studentHash = await bcrypt.hash("student123", 10);

  await User.create({
    name: "Test Teacher",
    email: "teacher@tms.edu",
    passwordHash: teacherHash,
    role: "teacher",
  });

  const classNames = [
    { name: "Software Engineering", department: "Computer Science", batch: "2024", schedule: "Monday 10:00 AM" },
    { name: "Artificial Intelligence", department: "Computer Science", batch: "2025", schedule: "Tuesday 2:00 PM" },
    { name: "Data Structures", department: "Computer Science", batch: "2024", schedule: "Wednesday 9:00 AM" },
  ];

  const classes = [];
  for (const c of classNames) {
    classes.push(await ClassModel.create(c));
  }

  const firstNames = [
    "Ahmed", "Fatima", "Hassan", "Sara", "Usman", "Ayesha", "Bilal", "Cyra",
    "Danish", "Emaan", "Farhan", "Gulnaz", "Hamza", "Iqra", "Junaid", "Khalid",
    "Laiba", "Mikhail", "Nadia", "Omar", "Parisa", "Qasim", "Rabia", "Saad",
    "Tania", "Umair", "Vaniya", "Waleed", "Xena", "Yasir", "Zara", "Ali",
    "Bisma", "Daniyal", "Eshaal", "Faizan", "Ghulam", "Hira", "Imran", "Javeria",
    "Kamran", "Lyba", "Moiz", "Naima", "Osama", "Priscilla", "Rameen", "Shahid",
    "Tuba", "Umar",
  ];
  const lastNames = [
    "Khan", "Ali", "Ahmed", "Malik", "Raza", "Noor", "Shah", "Tariq",
    "Siddiqui", "Butt", "Chaudhry", "Qureshi", "Awan", "Cheema", "Bhatti", "Gill",
    "Hussain", "Syed", "Mirza", "Baig", "Javed", "Iqbal", "Yousaf", "Zaidi",
    "Rao", "Durrani", "Shahid", "Nawaz", "Farooq", "Sultan", "Rehman", "Memon",
    "Khawaja", "Ansari", "Kazmi", "Sheikh", "Mughal", "Bano", "Zubair", "Parveen",
    "Tasleem", "Akhtar", "Begum", "Haroon", "Ismail", "Jaffer", "Khalid", "Liaqat",
    "Mahmood", "Naseem",
  ];

  let totalStudents = 0;

  for (let ci = 0; ci < classes.length; ci++) {
    const classDoc = classes[ci];
    const prefix = ["SE", "AI", "DS"][ci];

    for (let si = 0; si < STUDENTS_PER_CLASS; si++) {
      const firstName = firstNames[si % firstNames.length];
      const lastName = lastNames[(si + ci * 7) % lastNames.length];
      const rollNumber = `${prefix}-${classDoc.batch}-${String(si + 1).padStart(2, "0")}`;
      const email = `${firstName.toLowerCase()}${prefix.toLowerCase()}${String(si + 1).padStart(2, "0")}@uop.edu`;

      const user = await User.create({
        name: `${firstName} ${lastName}`,
        email,
        passwordHash: studentHash,
        role: "student",
        mustChangePassword: true,
      });

      await StudentModel.create({
        rollNumber,
        name: `${firstName} ${lastName}`,
        classId: classDoc._id,
        userId: String(user._id),
        email,
      });

      totalStudents++;
    }
  }

  console.log(
    `Test DB seeded: 1 teacher, ${totalStudents} students across ${classes.length} classes`
  );

  await mongoose.disconnect();
}
