import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({ url: "file:dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  await prisma.user.create({
    data: {
      name: "Teacher",
      email: "teacher@tms.edu",
      passwordHash,
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
      { rollNumber: "CS-24-001", name: "Ahmed Khan" },
      { rollNumber: "CS-24-002", name: "Fatima Ali" },
      { rollNumber: "CS-24-003", name: "Hassan Ahmed" },
      { rollNumber: "CS-24-004", name: "Sara Malik" },
      { rollNumber: "CS-24-005", name: "Usman Raza" },
    ]},
    { classId: aiClass.id, students: [
      { rollNumber: "AI-25-001", name: "Ayesha Noor" },
      { rollNumber: "AI-25-002", name: "Bilal Shah" },
      { rollNumber: "AI-25-003", name: "Cyra Ahmed" },
      { rollNumber: "AI-25-004", name: "Danish Khan" },
      { rollNumber: "AI-25-005", name: "Emaan Tariq" },
    ]},
    { classId: irClass.id, students: [
      { rollNumber: "IR-26-001", name: "Farhan Ali" },
      { rollNumber: "IR-26-002", name: "Gulnaz Bibi" },
      { rollNumber: "IR-26-003", name: "Hamza Tariq" },
      { rollNumber: "IR-26-004", name: "Iqra Siddiqui" },
      { rollNumber: "IR-26-005", name: "Junaid Ahmed" },
    ]},
  ];

  for (const { classId, students } of studentsData) {
    await prisma.student.createMany({
      data: students.map((s) => ({ ...s, classId })),
    });
  }

  console.log("Seed complete: 1 user, 3 classes, 15 students");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
