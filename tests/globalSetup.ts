import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({ url: "file:dev.db" });
const prisma = new PrismaClient({ adapter });

export default async function globalSetup() {
  await prisma.assignmentSubmission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.student.deleteMany();
  await prisma.class.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  await prisma.user.create({
    data: { name: "Teacher", email: "teacher@tms.edu", passwordHash },
  });

  const seClass = await prisma.class.create({
    data: { name: "Software Engineering", department: "Computer Science", batch: "2024", schedule: "Monday 10:00 AM" },
  });
  const aiClass = await prisma.class.create({
    data: { name: "Artificial Intelligence", department: "Computer Science", batch: "2025", schedule: "Tuesday 2:00 PM" },
  });
  const irClass = await prisma.class.create({
    data: { name: "International Relations", department: "Humanities", batch: "2026", schedule: "Wednesday 9:00 AM" },
  });

  await prisma.student.createMany({
    data: [
      { classId: seClass.id, rollNumber: "CS-24-001", name: "Ahmed Khan" },
      { classId: seClass.id, rollNumber: "CS-24-002", name: "Fatima Ali" },
      { classId: seClass.id, rollNumber: "CS-24-003", name: "Hassan Ahmed" },
      { classId: seClass.id, rollNumber: "CS-24-004", name: "Sara Malik" },
      { classId: seClass.id, rollNumber: "CS-24-005", name: "Usman Raza" },
      { classId: aiClass.id, rollNumber: "AI-25-001", name: "Ayesha Noor" },
      { classId: aiClass.id, rollNumber: "AI-25-002", name: "Bilal Shah" },
      { classId: aiClass.id, rollNumber: "AI-25-003", name: "Cyra Ahmed" },
      { classId: aiClass.id, rollNumber: "AI-25-004", name: "Danish Khan" },
      { classId: aiClass.id, rollNumber: "AI-25-005", name: "Emaan Tariq" },
      { classId: irClass.id, rollNumber: "IR-26-001", name: "Farhan Ali" },
      { classId: irClass.id, rollNumber: "IR-26-002", name: "Gulnaz Bibi" },
      { classId: irClass.id, rollNumber: "IR-26-003", name: "Hamza Tariq" },
      { classId: irClass.id, rollNumber: "IR-26-004", name: "Iqra Siddiqui" },
      { classId: irClass.id, rollNumber: "IR-26-005", name: "Junaid Ahmed" },
    ],
  });

  await prisma.$disconnect();
}
