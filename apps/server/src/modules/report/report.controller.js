import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import { Attendance } from '../../models/attendance.model.js';
import { Course } from '../../models/course.model.js';
import { Department } from '../../models/department.model.js';
import { Exam } from '../../models/exam.model.js';
import { Invoice } from '../../models/invoice.model.js';
import { Student } from '../../models/student.model.js';
import { User } from '../../models/user.model.js';
import { AppError } from '../../utils/AppError.js';

function safeDivide(numerator, denominator) {
  if (!denominator) {
    return 0;
  }

  return numerator / denominator;
}

function round(value, precision = 1) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function toCsv(rows) {
  return rows
    .map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(','))
    .join('\n');
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabelFromKey(key) {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

function toObjectId(value) {
  return new mongoose.Types.ObjectId(String(value));
}

function pdfBuffer(render) {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({ margin: 36, size: 'A4' });
    const chunks = [];

    document.on('data', (chunk) => chunks.push(chunk));
    document.on('end', () => resolve(Buffer.concat(chunks)));
    document.on('error', reject);

    render(document);
    document.end();
  });
}

async function getStudentByUser(userId) {
  const student = await Student.findOne({ user: userId })
    .populate('user', 'fullName email role')
    .populate('department', 'name code');

  if (!student) {
    throw new AppError('Student profile not found', 404);
  }

  return student;
}

async function getStudentRiskSnapshot(studentIds = []) {
  const attendanceAgg = await Attendance.aggregate([
    {
      $match: studentIds.length ? { student: { $in: studentIds } } : {}
    },
    {
      $group: {
        _id: '$student',
        totalAttendance: { $sum: 1 },
        presentCount: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
        lateCount: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
        absentCount: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } }
      }
    },
    {
      $addFields: {
        attendanceRate: {
          $multiply: [
            {
              $divide: [
                { $add: ['$presentCount', { $multiply: ['$lateCount', 0.5] }] },
                { $cond: [{ $gt: ['$totalAttendance', 0] }, '$totalAttendance', 1] }
              ]
            },
            100
          ]
        }
      }
    }
  ]);

  const invoiceAgg = await Invoice.aggregate([
    {
      $match: studentIds.length ? { student: { $in: studentIds } } : {}
    },
    {
      $group: {
        _id: '$student',
        totalInvoices: { $sum: 1 },
        pendingInvoices: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        overdueInvoices: { $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] } },
        paidInvoices: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
        outstandingAmount: {
          $sum: {
            $cond: [{ $in: ['$status', ['pending', 'overdue']] }, '$amount', 0]
          }
        }
      }
    }
  ]);

  const riskByStudent = new Map();

  for (const row of attendanceAgg) {
    riskByStudent.set(String(row._id), {
      attendanceRate: round(row.attendanceRate || 0),
      totalAttendance: row.totalAttendance,
      presentCount: row.presentCount,
      lateCount: row.lateCount,
      absentCount: row.absentCount
    });
  }

  for (const row of invoiceAgg) {
    const current = riskByStudent.get(String(row._id)) ?? {
      attendanceRate: 0,
      totalAttendance: 0,
      presentCount: 0,
      lateCount: 0,
      absentCount: 0
    };

    const riskScore = Math.min(
      100,
      Math.max(
        0,
        round(
          (100 - current.attendanceRate) * 0.55 +
            row.overdueInvoices * 18 +
            row.pendingInvoices * 6 +
            safeDivide(row.outstandingAmount, 1000) * 4,
          1
        )
      )
    );

    riskByStudent.set(String(row._id), {
      ...current,
      totalInvoices: row.totalInvoices,
      pendingInvoices: row.pendingInvoices,
      overdueInvoices: row.overdueInvoices,
      paidInvoices: row.paidInvoices,
      outstandingAmount: row.outstandingAmount,
      riskScore
    });
  }

  const studentDocs = await Student.find(studentIds.length ? { _id: { $in: studentIds } } : {})
    .populate('user', 'fullName email role')
    .populate('department', 'name code');

  const students = studentDocs.map((student) => {
    const metrics = riskByStudent.get(String(student._id)) ?? {
      attendanceRate: 0,
      totalAttendance: 0,
      presentCount: 0,
      lateCount: 0,
      absentCount: 0,
      totalInvoices: 0,
      pendingInvoices: 0,
      overdueInvoices: 0,
      paidInvoices: 0,
      outstandingAmount: 0,
      riskScore: 100
    };

    return {
      id: String(student._id),
      enrollmentNo: student.enrollmentNo,
      fullName: student.user?.fullName ?? 'Student',
      email: student.user?.email ?? '',
      department: student.department?.name ?? '',
      semester: student.semester,
      section: student.section,
      attendanceRate: metrics.attendanceRate,
      totalAttendance: metrics.totalAttendance,
      overdueInvoices: metrics.overdueInvoices ?? 0,
      pendingInvoices: metrics.pendingInvoices ?? 0,
      outstandingAmount: metrics.outstandingAmount ?? 0,
      riskScore: metrics.riskScore ?? 100,
      riskLevel:
        (metrics.attendanceRate ?? 0) < 65 || (metrics.overdueInvoices ?? 0) > 0
          ? 'High'
          : (metrics.attendanceRate ?? 0) < 80 || (metrics.pendingInvoices ?? 0) > 0
            ? 'Medium'
            : 'Low'
    };
  });

  return students.sort((left, right) => right.riskScore - left.riskScore);
}

async function buildAdminDashboard() {
  const [departmentCount, courseCount, studentCount, facultyCount, attendanceStats, invoiceStats, examCount, upcomingExams, monthlyAttendance] = await Promise.all([
    Department.countDocuments(),
    Course.countDocuments(),
    Student.countDocuments(),
    User.countDocuments({ role: 'faculty' }),
    Attendance.aggregate([
      {
        $group: {
          _id: null,
          totalAttendance: { $sum: 1 },
          presentCount: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          lateCount: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
          absentCount: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } }
        }
      }
    ]),
    Invoice.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      }
    ]),
    Exam.countDocuments(),
    Exam.countDocuments({ date: { $gte: new Date() } }),
    Attendance.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1)
          }
        }
      },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          totalAttendance: { $sum: 1 },
          presentCount: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ])
  ]);

  const riskStudents = await getStudentRiskSnapshot();
  const attendanceAggregate = attendanceStats[0] ?? { totalAttendance: 0, presentCount: 0, lateCount: 0, absentCount: 0 };
  const invoiceMap = new Map(invoiceStats.map((item) => [item._id, item]));

  return {
    role: 'admin',
    title: 'Institution Overview',
    summary: {
      departments: departmentCount,
      courses: courseCount,
      students: studentCount,
      faculty: facultyCount,
      exams: examCount,
      upcomingExams,
      attendanceRate: round(
        safeDivide(attendanceAggregate.presentCount + attendanceAggregate.lateCount * 0.5, attendanceAggregate.totalAttendance) * 100
      ),
      overdueInvoices: invoiceMap.get('overdue')?.count ?? 0,
      pendingInvoices: invoiceMap.get('pending')?.count ?? 0
    },
    invoiceBreakdown: invoiceStats.map((item) => ({
      status: item._id,
      count: item.count,
      amount: item.amount
    })),
    attendanceTrend: monthlyAttendance.map((row) => ({
      label: monthLabelFromKey(monthKey(new Date(row._id.year, row._id.month - 1, 1))),
      total: row.totalAttendance,
      present: row.presentCount
    })),
    atRiskStudents: riskStudents.slice(0, 8)
  };
}

async function buildFacultyDashboard(userId) {
  const [attendanceStats, recentAttendance, upcomingExams, courseCount, invoiceStats] = await Promise.all([
    Attendance.aggregate([
      { $match: { faculty: toObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalAttendance: { $sum: 1 },
          presentCount: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          lateCount: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
          absentCount: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } }
        }
      }
    ]),
    Attendance.find({ faculty: userId }).populate('student', 'enrollmentNo section semester').populate('course', 'title code').sort({ date: -1 }).limit(6),
    Exam.find({ date: { $gte: new Date() } }).populate('department', 'name code').populate('course', 'title code').sort({ date: 1 }).limit(6),
    Attendance.distinct('course', { faculty: userId }).then((courses) => courses.length),
    Invoice.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  const attendanceAggregate = attendanceStats[0] ?? { totalAttendance: 0, presentCount: 0, lateCount: 0, absentCount: 0 };
  const riskStudents = (await getStudentRiskSnapshot()).slice(0, 8);

  return {
    role: 'faculty',
    title: 'Teaching Dashboard',
    summary: {
      courses: courseCount,
      markedSessions: attendanceAggregate.totalAttendance,
      attendanceRate: round(
        safeDivide(attendanceAggregate.presentCount + attendanceAggregate.lateCount * 0.5, attendanceAggregate.totalAttendance) * 100
      ),
      upcomingExams: upcomingExams.length,
      overdueInvoices: invoiceStats.find((item) => item._id === 'overdue')?.count ?? 0
    },
    recentAttendance: recentAttendance.map((item) => ({
      id: String(item._id),
      date: item.date,
      student: item.student?.enrollmentNo ?? '',
      course: item.course?.code ?? '',
      status: item.status
    })),
    upcomingExams: upcomingExams.map((exam) => ({
      id: String(exam._id),
      date: exam.date,
      examType: exam.examType,
      course: exam.course?.code ?? '',
      department: exam.department?.name ?? ''
    })),
    atRiskStudents: riskStudents
  };
}

async function buildStudentDashboard(userId) {
  const student = await getStudentByUser(userId);
  const [attendanceSummary, recentAttendance, overdueInvoices, pendingInvoices, upcomingExams] = await Promise.all([
    Attendance.aggregate([
      { $match: { student: student._id } },
      {
        $group: {
          _id: null,
          totalAttendance: { $sum: 1 },
          presentCount: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          lateCount: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
          absentCount: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } }
        }
      }
    ]),
    Attendance.find({ student: student._id }).populate('course', 'title code').sort({ date: -1 }).limit(6),
    Invoice.countDocuments({ student: student._id, status: 'overdue' }),
    Invoice.countDocuments({ student: student._id, status: 'pending' }),
    Exam.find({ department: student.department._id, date: { $gte: new Date() } }).populate('course', 'title code').sort({ date: 1 }).limit(6)
  ]);

  const attendanceAggregate = attendanceSummary[0] ?? { totalAttendance: 0, presentCount: 0, lateCount: 0, absentCount: 0 };
  const attendanceRate = round(
    safeDivide(attendanceAggregate.presentCount + attendanceAggregate.lateCount * 0.5, attendanceAggregate.totalAttendance) * 100
  );
  const riskScore = Math.min(100, Math.max(0, round((100 - attendanceRate) * 0.75 + overdueInvoices * 20 + pendingInvoices * 5, 1)));

  return {
    role: 'student',
    title: 'My Progress',
    student: {
      id: String(student._id),
      fullName: student.user?.fullName ?? 'Student',
      enrollmentNo: student.enrollmentNo,
      department: student.department?.name ?? '',
      semester: student.semester,
      section: student.section
    },
    summary: {
      attendanceRate,
      markedSessions: attendanceAggregate.totalAttendance,
      overdueInvoices,
      pendingInvoices,
      upcomingExams: upcomingExams.length,
      riskScore,
      riskLabel: attendanceRate < 65 || overdueInvoices > 0 ? 'High' : attendanceRate < 80 ? 'Medium' : 'Healthy'
    },
    recentAttendance: recentAttendance.map((item) => ({
      id: String(item._id),
      date: item.date,
      course: item.course?.code ?? '',
      status: item.status
    })),
    upcomingExams: upcomingExams.map((exam) => ({
      id: String(exam._id),
      date: exam.date,
      examType: exam.examType,
      course: exam.course?.code ?? ''
    }))
  };
}

export async function getDashboard(req, res, next) {
  try {
    let dashboard;

    if (req.user.role === 'student') {
      dashboard = await buildStudentDashboard(req.user.sub);
    } else if (req.user.role === 'faculty') {
      dashboard = await buildFacultyDashboard(req.user.sub);
    } else {
      dashboard = await buildAdminDashboard();
    }

    return res.status(200).json({ success: true, data: dashboard });
  } catch (error) {
    return next(error);
  }
}

export async function getAtRiskStudents(req, res, next) {
  try {
    const students = await getStudentRiskSnapshot();
    return res.status(200).json({ success: true, data: students.slice(0, req.validated.query.limit) });
  } catch (error) {
    return next(error);
  }
}

export async function searchCampusRecords(req, res, next) {
  try {
    const { q, limit } = req.validated.query;
    const search = q.trim();

    const [users, departments, courses, students] = await Promise.all([
      User.find({ $text: { $search: search } }).select('fullName email role').limit(limit),
      Department.find({ $text: { $search: search } }).select('name code description').limit(limit),
      Course.find({ $text: { $search: search } })
        .populate('department', 'name code')
        .select('title code semester creditHours department')
        .limit(limit),
      Student.find({ $text: { $search: search } })
        .populate('user', 'fullName email role')
        .populate('department', 'name code')
        .select('user department enrollmentNo semester section active')
        .limit(limit)
    ]);

    const userIds = users.map((user) => user._id);
    const studentFromUsers = userIds.length
      ? await Student.find({ user: { $in: userIds } })
          .populate('user', 'fullName email role')
          .populate('department', 'name code')
          .select('user department enrollmentNo semester section active')
      : [];

    return res.status(200).json({
      success: true,
      data: {
        users,
        departments,
        courses,
        students: [...students, ...studentFromUsers]
      }
    });
  } catch (error) {
    if (String(error?.message ?? '').includes('text index')) {
      return next(new AppError('Search index is still being built', 503));
    }

    return next(error);
  }
}

function buildDashboardCsv(dashboard) {
  const rows = [
    ['Metric', 'Value'],
    ...Object.entries(dashboard.summary ?? {}).map(([key, value]) => [key, value])
  ];

  return toCsv(rows);
}

function buildAtRiskCsv(students) {
  const rows = [
    ['Enrollment No', 'Name', 'Department', 'Semester', 'Attendance Rate', 'Overdue Invoices', 'Outstanding Amount', 'Risk Score', 'Risk Level'],
    ...students.map((student) => [
      student.enrollmentNo,
      student.fullName,
      student.department,
      student.semester,
      student.attendanceRate,
      student.overdueInvoices,
      student.outstandingAmount,
      student.riskScore,
      student.riskLevel
    ])
  ];

  return toCsv(rows);
}

function renderPdfTitle(document, title, subtitle) {
  document.fontSize(20).fillColor('#172230').text(title);
  if (subtitle) {
    document.moveDown(0.3).fontSize(10).fillColor('#516073').text(subtitle);
  }
  document.moveDown(0.8);
}

function renderPdfKeyValues(document, summary) {
  Object.entries(summary).forEach(([key, value]) => {
    document.fontSize(11).fillColor('#172230').text(`${key}: `, { continued: true });
    document.fillColor('#0b6f67').text(String(value));
  });
}

function renderPdfTable(document, headers, rows) {
  document.moveDown(0.6).fontSize(11).fillColor('#172230');
  document.text(headers.join(' | '));
  document.moveDown(0.2).fillColor('#516073');
  rows.forEach((row) => document.text(row.join(' | ')));
}

export async function exportReport(req, res, next) {
  try {
    const { type, format } = req.validated.query;

    if (type === 'dashboard') {
      const dashboard = await getDashboardSnapshot(req.user);

      if (format === 'csv') {
        const csv = buildDashboardCsv(dashboard);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="dashboard-report.csv"');
        return res.status(200).send(csv);
      }

      const buffer = await pdfBuffer((document) => {
        renderPdfTitle(document, 'CLG ERP Dashboard Report', `${dashboard.title} | ${new Date().toLocaleDateString()}`);
        renderPdfKeyValues(document, dashboard.summary ?? {});

        if (dashboard.attendanceTrend?.length) {
          renderPdfTable(
            document,
            ['Month', 'Attendance', 'Present'],
            dashboard.attendanceTrend.map((item) => [item.label, item.total, item.present])
          );
        }
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="dashboard-report.pdf"');
      return res.status(200).send(buffer);
    }

    const students = await getStudentRiskSnapshot();

    if (format === 'csv') {
      const csv = buildAtRiskCsv(students);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="at-risk-students.csv"');
      return res.status(200).send(csv);
    }

    const buffer = await pdfBuffer((document) => {
      renderPdfTitle(document, 'At-Risk Students Report', 'Attendance and fee indicators used to flag students for intervention.');
      renderPdfTable(
        document,
        ['Enrollment', 'Name', 'Department', 'Attendance', 'Overdue', 'Risk'],
        students.map((student) => [
          student.enrollmentNo,
          student.fullName,
          student.department,
          `${student.attendanceRate}%`,
          student.overdueInvoices,
          `${student.riskScore} (${student.riskLevel})`
        ])
      );
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="at-risk-students.pdf"');
    return res.status(200).send(buffer);
  } catch (error) {
    return next(error);
  }
}

async function getDashboardSnapshot(user) {
  if (user.role === 'student') {
    return buildStudentDashboard(user.sub);
  }

  if (user.role === 'faculty') {
    return buildFacultyDashboard(user.sub);
  }

  return buildAdminDashboard();
}