package com.erp.studenterp.service;

import com.erp.studenterp.dto.*;
import com.erp.studenterp.entity.*;
import com.erp.studenterp.repository.*;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FeeService {
private final FeePaymentRepository feePaymentRepository;
    private final FeeStructureRepository feeStructureRepository;

    private final StudentFeeRepository studentFeeRepository;

    private final StudentRepository studentRepository;

    private final CourseRepository courseRepository;
@Transactional
public FeePaymentResponse makePayment(
        Long studentFeeId,
        FeePaymentRequest request) {

    StudentFee studentFee = findStudentFee(studentFeeId);

    BigDecimal amount =
            request.getAmount();

    BigDecimal dueAmount =
            studentFee.getDueAmount();

    if (amount.compareTo(dueAmount) > 0) {

        throw new RuntimeException(
                "Payment amount cannot be greater than due amount"
        );
    }

    BigDecimal newPaidAmount =
            studentFee
                    .getPaidAmount()
                    .add(amount);

    BigDecimal newDueAmount =
            studentFee
                    .getTotalAmount()
                    .subtract(newPaidAmount);

    studentFee.setPaidAmount(
            newPaidAmount
    );

    studentFee.setDueAmount(
            newDueAmount
    );

    if (newDueAmount.compareTo(
            BigDecimal.ZERO
    ) == 0) {

        studentFee.setStatus(
                PaymentStatus.PAID
        );

    } else {

        studentFee.setStatus(
                PaymentStatus.PARTIAL
        );
    }

    studentFeeRepository.save(
            studentFee
    );

    String transactionId =
            "TXN-" +
            System.currentTimeMillis();

    FeePayment payment =
            FeePayment.builder()

                    .studentFee(studentFee)

                    .transactionId(
                            transactionId
                    )

                    .amount(amount)

                    .paymentDate(
                            java.time.LocalDateTime.now()
                    )

                    .paymentMethod(
                            request.getPaymentMethod()
                    )

                    .status(
                            PaymentStatus.PAID
                    )

                    .remarks(
                            request.getRemarks()
                    )

                    .build();

    FeePayment savedPayment =
            feePaymentRepository.save(
                    payment
            );

    return toPaymentResponse(
            savedPayment
    );
}

    // ==========================================
    // CREATE FEE STRUCTURE
    // ==========================================

    @Transactional
    public FeeStructureResponse createFeeStructure(
            FeeStructureRequest request) {

        Course course =
                courseRepository
                        .findById(request.getCourseId())
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Course not found"
                                )
                        );

        FeeStructure structure =
                FeeStructure.builder()

                        .course(course)

                        .semester(
                                request.getSemester()
                        )

                        .feeType(
                                request.getFeeType()
                        )

                        .amount(
                                request.getAmount()
                        )

                        .academicYear(
                                request.getAcademicYear()
                        )

                        .active(true)

                        .build();

        FeeStructure saved =
                feeStructureRepository.save(
                        structure
                );

        // Existing students also need a fee record when an admin adds a new
        // structure after those students were created.
        studentRepository
                .findByCourseIdAndSemesterAndActiveTrue(
                        course.getId(),
                        saved.getSemester()
                )
                .forEach(student -> assignFee(
                        student.getId(),
                        saved.getId()
                ));

        return toFeeStructureResponse(saved);
    }


    // ==========================================
    // GET FEE STRUCTURES
    // ==========================================

    @Transactional(readOnly = true)
    public List<FeeStructureResponse>
    getFeeStructures() {

        return feeStructureRepository
                .findAll()
                .stream()
                .map(this::toFeeStructureResponse)
                .toList();
    }


    // ==========================================
    // ASSIGN FEE TO STUDENT
    // ==========================================

    @Transactional
    public StudentFeeResponse assignFee(
            Long studentId,
            Long feeStructureId) {

        Student student =
                studentRepository
                        .findByIdAndActiveTrue(
                                studentId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Student not found"
                                )
                        );

        FeeStructure structure =
                feeStructureRepository
                        .findByIdAndActiveTrue(
                                feeStructureId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Fee structure not found"
                                )
                        );

        // A student record can be saved without a course or semester, so both
        // are checked before they are compared. Without this the mismatch check
        // below throws a NullPointerException, which reaches the browser as an
        // empty "the request could not be completed" and no fee is assigned.
        if (student.getCourse() == null) {

            throw new RuntimeException(
                    "Student has no course. Set the student's course before "
                            + "assigning a fee."
            );
        }

        if (student.getSemester() == null) {

            throw new RuntimeException(
                    "Student has no semester. Set the student's semester before "
                            + "assigning a fee."
            );
        }

        if (!student
                .getCourse()
                .getId()
                .equals(
                        structure
                                .getCourse()
                                .getId()
                )) {

            throw new RuntimeException(
                    "Fee structure does not belong to student's course"
            );
        }

        if (!student
                .getSemester()
                .equals(
                        structure.getSemester()
                )) {

            throw new RuntimeException(
                    "Fee structure does not belong to student's semester"
            );
        }

        StudentFee existingFee = studentFeeRepository
                .findByStudentId(studentId)
                .stream()
                .filter(fee -> fee.getFeeStructure().getId()
                        .equals(feeStructureId))
                .findFirst()
                .orElse(null);

        // Assigning the same structure twice (e.g. re-running bulk enrolment)
        // is a no-op rather than an error, so callers don't have to check first.
        if (existingFee != null) {
            return toStudentFeeResponse(existingFee);
        }

        StudentFee studentFee = StudentFee.builder()

                        .student(student)

                        .feeStructure(structure)

                        .totalAmount(
                                structure.getAmount()
                        )

                        .paidAmount(
                                BigDecimal.ZERO
                        )

                        .dueAmount(
                                structure.getAmount()
                        )

                        .status(
                                PaymentStatus.PENDING
                        )

                        .build();

        StudentFee saved =
                studentFeeRepository.save(
                        studentFee
                );

        return toStudentFeeResponse(saved);
    }


    // ==========================================
    // ASSIGN FEE TO WHOLE CLASS (course + semester)
    // ==========================================

    /**
     * Assigns a fee structure to every active student in its course and
     * semester, regardless of section. Students who already have the
     * structure are skipped by {@link #assignFee}, so this is safe to run
     * more than once (e.g. after new students join the class).
     */
    @Transactional
    public List<StudentFeeResponse> assignFeeToClass(Long feeStructureId) {

        FeeStructure structure = feeStructureRepository
                .findByIdAndActiveTrue(feeStructureId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Fee structure not found"
                        )
                );

        return studentRepository
                .findByCourseIdAndSemesterAndActiveTrue(
                        structure.getCourse().getId(),
                        structure.getSemester()
                )
                .stream()
                .map(student -> assignFee(student.getId(), feeStructureId))
                .toList();
    }

    // ==========================================
    // GET STUDENT FEES
    // ==========================================

    @Transactional
    public List<StudentFeeResponse>
    getStudentFees(Long studentId) {

        Student student = studentRepository
                .findByIdAndActiveTrue(studentId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Student not found"
                        )
                );

        ensureActiveFeeStructuresAreAssigned(student);

        return studentFeeRepository
                .findByStudentId(studentId)
                .stream()
                .map(this::toStudentFeeResponse)
                .toList();
    }

    @Transactional
    public StudentFeeDashboardResponse getStudentFeeDashboard(Long studentId) {
        Student student = studentRepository.findByIdAndActiveTrue(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        ensureActiveFeeStructuresAreAssigned(student);

        List<StudentFee> fees = studentFeeRepository.findByStudentId(studentId);
        BigDecimal total = fees.stream().map(StudentFee::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal paid = fees.stream().map(StudentFee::getPaidAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal due = fees.stream().map(StudentFee::getDueAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return StudentFeeDashboardResponse.builder()
                .studentId(student.getId())
                .enrollmentNumber(student.getEnrollmentNumber())
                .studentName(student.getFirstName() + (student.getLastName() == null
                        || student.getLastName().isBlank() ? "" : " " + student.getLastName()))
                .totalFee(total).paidAmount(paid).dueAmount(due)
                .pendingFeeCount(fees.stream().filter(f -> f.getStatus() == PaymentStatus.PENDING).count())
                .partialFeeCount(fees.stream().filter(f -> f.getStatus() == PaymentStatus.PARTIAL).count())
                .paidFeeCount(fees.stream().filter(f -> f.getStatus() == PaymentStatus.PAID).count())
                .fees(fees.stream().map(this::toStudentFeeResponse).toList())
                .build();
    }

    @Transactional
    public StudentFeeDashboardResponse getStudentFeeDashboardByEmail(String email) {
        Student student = studentRepository.findByEmailAndActiveTrue(email)
                .orElseThrow(() -> new RuntimeException("Student profile not found"));
        return getStudentFeeDashboard(student.getId());
    }


    // ==========================================
    // STUDENT SELF SERVICE (ownership checked)
    // ==========================================

    /**
     * The payments made against one of the caller's own fees. Mirrors
     * {@link #getPaymentHistory} but refuses a fee belonging to anybody else.
     */
    @Transactional(readOnly = true)
    public List<FeePaymentResponse> getPaymentHistoryForStudent(
            String email, Long studentFeeId) {

        StudentFee studentFee = studentFeeRepository
                .findById(studentFeeId)
                .orElseThrow(() ->
                        new RuntimeException("Student fee not found")
                );

        requireOwner(studentFee, email);

        return feePaymentRepository
                .findByStudentFeeIdOrderByPaymentDateDesc(studentFee.getId())
                .stream()
                .map(this::toPaymentResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public FeeReceiptResponse getReceiptForStudent(String email, Long paymentId) {
        requireOwnedPayment(email, paymentId);
        return getReceipt(paymentId);
    }

    /**
     * Gate for the PDF endpoint, which streams its bytes from
     * FeeReceiptPdfService and so cannot go through getReceiptForStudent.
     */
    @Transactional(readOnly = true)
    public void requireOwnedPayment(String email, Long paymentId) {

        FeePayment payment = feePaymentRepository
                .findById(paymentId)
                .orElseThrow(() ->
                        new RuntimeException("Payment not found")
                );

        requireOwner(payment.getStudentFee(), email);
    }

    /**
     * Reports the same wording as a missing record on purpose: confirming that a
     * fee exists but belongs to someone else would leak the ID space.
     */
    private void requireOwner(StudentFee studentFee, String email) {

        Student student = studentRepository
                .findByEmailAndActiveTrue(email)
                .orElseThrow(() ->
                        new RuntimeException("Student profile not found")
                );

        if (!studentFee.getStudent().getId().equals(student.getId())) {
            throw new RuntimeException("Student fee not found");
        }
    }


    // ==========================================
    // MAPPERS
    // ==========================================

    private FeeStructureResponse
    toFeeStructureResponse(
            FeeStructure structure) {

        return FeeStructureResponse
                .builder()

                .id(structure.getId())

                .courseId(
                        structure
                                .getCourse()
                                .getId()
                )

                .courseName(
                        structure
                                .getCourse()
                                .getCourseName()
                )

                .semester(
                        structure.getSemester()
                )

                .feeType(
                        structure.getFeeType()
                )

                .amount(
                        structure.getAmount()
                )

                .academicYear(
                        structure.getAcademicYear()
                )

                .active(
                        structure.isActive()
                )

                .build();
    }


    private StudentFeeResponse
    toStudentFeeResponse(
            StudentFee fee) {

        Student student =
                fee.getStudent();

        String name =
                student.getFirstName();

        if (student.getLastName() != null &&
                !student.getLastName().isBlank()) {

            name +=
                    " " + student.getLastName();
        }

        return StudentFeeResponse
                .builder()

                .id(fee.getId())

                .studentId(
                        student.getId()
                )

                .enrollmentNumber(
                        student.getEnrollmentNumber()
                )

                .studentName(name)

                .feeStructureId(
                        fee
                                .getFeeStructure()
                                .getId()
                )

                .feeType(
                        fee
                                .getFeeStructure()
                                .getFeeType()
                )

                .academicYear(
                        fee
                                .getFeeStructure()
                                .getAcademicYear()
                )

                .totalAmount(
                        fee.getTotalAmount()
                )

                .paidAmount(
                        fee.getPaidAmount()
                )

                .dueAmount(
                        fee.getDueAmount()
                )

                .status(
                        fee.getStatus()
                )

                .build();

    }

    private FeePaymentResponse
    toPaymentResponse(
            FeePayment payment) {

        StudentFee studentFee =
                payment.getStudentFee();

        Student student =
                studentFee.getStudent();

        String name =
                student.getFirstName();

        if (student.getLastName() != null &&
                !student.getLastName().isBlank()) {

            name +=
                    " " + student.getLastName();
        }

        return FeePaymentResponse
                .builder()

                .id(payment.getId())

                .studentFeeId(
                        studentFee.getId()
                )

                .studentId(
                        student.getId()
                )

                .enrollmentNumber(
                        student.getEnrollmentNumber()
                )

                .studentName(name)

                .transactionId(
                        payment.getTransactionId()
                )

                .amount(
                        payment.getAmount()
                )

                .totalAmount(
                        studentFee.getTotalAmount()
                )

                .paidAmount(
                        studentFee.getPaidAmount()
                )

                .dueAmount(
                        studentFee.getDueAmount()
                )

                .paymentMethod(
                        payment.getPaymentMethod().name()
                )

                .paymentDate(
                        payment.getPaymentDate()
                )

                .status(
                        payment.getStatus()
                )

                .remarks(
                        payment.getRemarks()
                )

                .build();
    }
    @Transactional(readOnly = true)
public List<FeePaymentResponse>
getPaymentHistory(
        Long studentFeeId) {

    StudentFee studentFee = findStudentFee(studentFeeId);

    return feePaymentRepository
            .findByStudentFeeIdOrderByPaymentDateDesc(
                    studentFee.getId()
            )
            .stream()
            .map(this::toPaymentResponse)
            .toList();
}

    /**
     * Resolves the fee record used by payment endpoints.  The primary key is a
     * student-fee ID, but accepting a student ID when it has a single fee keeps
     * the endpoint compatible with clients that navigate from /students/{id}.
     */
    private StudentFee findStudentFee(Long studentFeeId) {
        return studentFeeRepository.findById(studentFeeId)
                .orElseGet(() -> {
                    Student student = studentRepository
                            .findByIdAndActiveTrue(studentFeeId)
                            .orElseThrow(() ->
                                    new RuntimeException("Student fee not found")
                            );

                    ensureActiveFeeStructuresAreAssigned(student);

                    List<StudentFee> studentFees = studentFeeRepository
                            .findByStudentId(studentFeeId);

                    if (studentFees.size() == 1) {
                        return studentFees.get(0);
                    }

                    if (studentFees.size() > 1) {
                        throw new RuntimeException(
                                "Multiple fees found for this student. Use the student fee ID."
                        );
                    }

                    throw new RuntimeException(
                            "No active fee structure is assigned to this student"
                    );
                });
    }

    /** Assigns every applicable active fee structure exactly once. */
    @Transactional
    public void assignActiveFeesToStudent(Long studentId) {
        Student student = studentRepository.findByIdAndActiveTrue(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        ensureActiveFeeStructuresAreAssigned(student);
    }

    private void ensureActiveFeeStructuresAreAssigned(Student student) {
        // Fee structures are keyed on course and semester, so a student without
        // either simply has none to inherit yet.
        if (student.getCourse() == null || student.getSemester() == null) {
            return;
        }

        feeStructureRepository
                .findByCourseIdAndSemesterAndActiveTrue(
                        student.getCourse().getId(),
                        student.getSemester()
                )
                .forEach(structure -> assignFee(
                        student.getId(),
                        structure.getId()
                ));
    }
    @Transactional(readOnly = true)
public FeeReceiptResponse getReceipt(
        Long paymentId) {

    FeePayment payment =
            feePaymentRepository
                    .findById(paymentId)
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Payment not found"
                            )
                    );

    StudentFee studentFee =
            payment.getStudentFee();

    Student student =
            studentFee.getStudent();

    String studentName =
            student.getFirstName();

    if (student.getLastName() != null &&
            !student.getLastName().isBlank()) {

        studentName +=
                " " + student.getLastName();
    }

    String receiptNumber =
            "REC-" + payment.getId();

    return FeeReceiptResponse
            .builder()

            .receiptNumber(
                    receiptNumber
            )

            .transactionId(
                    payment.getTransactionId()
            )

            .studentId(
                    student.getId()
            )

            .enrollmentNumber(
                    student.getEnrollmentNumber()
            )

            .studentName(
                    studentName
            )

            .courseName(
                    student.getCourse()
                            .getCourseName()
            )

            .semester(
                    student.getSemester()
            )

            .feeType(
                    studentFee
                            .getFeeStructure()
                            .getFeeType()
                            .name()
            )

            .paymentAmount(
                    payment.getAmount()
            )

            .totalFee(
                    studentFee.getTotalAmount()
            )

            .paidAmount(
                    studentFee.getPaidAmount()
            )

            .dueAmount(
                    studentFee.getDueAmount()
            )

            .paymentMethod(
                    payment
                            .getPaymentMethod()
                            .name()
            )

            .paymentDate(
                    payment.getPaymentDate()
            )

            .remarks(
                    payment.getRemarks()
            )

            .build();
}
}
