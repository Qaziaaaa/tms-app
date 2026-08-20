import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({ url: "file:dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const teacher = await prisma.user.create({
    data: {
      name: "Teacher",
      email: "teacher@tms.edu",
      passwordHash,
      role: "teacher",
    },
  });

  const seClass = await prisma.class.create({
    data: {
      name: "Software Engineering",
      department: "Computer Science",
      batch: "2024",
      schedule: "Monday 10:00 AM",
    },
  });

  const aiClass = await prisma.class.create({
    data: {
      name: "Artificial Intelligence",
      department: "Computer Science",
      batch: "2025",
      schedule: "Tuesday 2:00 PM",
    },
  });

  const irClass = await prisma.class.create({
    data: {
      name: "International Relations",
      department: "Humanities",
      batch: "2026",
      schedule: "Wednesday 9:00 AM",
    },
  });

  const studentsData = [
    { classId: seClass.id, students: [
      { rollNumber: "CS-24-001", name: "Ahmed Khan", email: "ahmed@student.edu" },
      { rollNumber: "CS-24-002", name: "Fatima Ali", email: "fatima@student.edu" },
      { rollNumber: "CS-24-003", name: "Hassan Ahmed", email: "hassan@student.edu" },
      { rollNumber: "CS-24-004", name: "Sara Malik", email: "sara@student.edu" },
      { rollNumber: "CS-24-005", name: "Usman Raza", email: "usman@student.edu" },
    ]},
    { classId: aiClass.id, students: [
      { rollNumber: "AI-25-001", name: "Ayesha Noor", email: "ayesha@student.edu" },
      { rollNumber: "AI-25-002", name: "Bilal Shah", email: "bilal@student.edu" },
      { rollNumber: "AI-25-003", name: "Cyra Ahmed", email: "cyra@student.edu" },
      { rollNumber: "AI-25-004", name: "Danish Khan", email: "danish@student.edu" },
      { rollNumber: "AI-25-005", name: "Emaan Tariq", email: "emaan@student.edu" },
    ]},
    { classId: irClass.id, students: [
      { rollNumber: "IR-26-001", name: "Farhan Ali", email: "farhan@student.edu" },
      { rollNumber: "IR-26-002", name: "Gulnaz Bibi", email: "gulnaz@student.edu" },
      { rollNumber: "IR-26-003", name: "Hamza Tariq", email: "hamza@student.edu" },
      { rollNumber: "IR-26-004", name: "Iqra Siddiqui", email: "iqra@student.edu" },
      { rollNumber: "IR-26-005", name: "Junaid Ahmed", email: "junaid@student.edu" },
    ]},
  ];

  let studentUserCount = 0;
  for (const { classId, students } of studentsData) {
    for (const s of students) {
      const user = await prisma.user.create({
        data: {
          name: s.name,
          email: s.email,
          passwordHash,
          role: "student",
        },
      });
      await prisma.student.create({
        data: {
          rollNumber: s.rollNumber,
          name: s.name,
          classId,
          userId: user.id,
          email: s.email,
        },
      });
      studentUserCount++;
    }
  }

  console.log(`Seed complete: 1 teacher, ${studentUserCount} students, 3 classes`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
