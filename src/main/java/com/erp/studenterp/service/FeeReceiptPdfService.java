package com.erp.studenterp.service;

import com.erp.studenterp.entity.FeePayment;
import com.erp.studenterp.entity.Student;
import com.erp.studenterp.entity.StudentFee;
import com.erp.studenterp.repository.FeePaymentRepository;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfWriter;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;

@Service
@RequiredArgsConstructor
public class FeeReceiptPdfService {

    private final FeePaymentRepository feePaymentRepository;

    /**
     * Held open for the whole render: the receipt walks payment -> student fee
     * -> student -> course and -> fee structure, and every one of those is
     * LAZY. With spring.jpa.open-in-view=false the session is already gone by
     * the time the first hop is followed, so without this the download fails
     * with a LazyInitializationException.
     */
    @Transactional(readOnly = true)
    public byte[] generateReceipt(Long paymentId) {

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

        try {

            ByteArrayOutputStream outputStream =
                    new ByteArrayOutputStream();

            Document document =
                    new Document(
                            PageSize.A4,
                            40,
                            40,
                            40,
                            40
                    );

            PdfWriter.getInstance(
                    document,
                    outputStream
            );

            document.open();

            // =========================
            // HEADER
            // =========================

            Font titleFont =
                    FontFactory.getFont(
                            FontFactory.HELVETICA_BOLD,
                            20
                    );

            Paragraph title =
                    new Paragraph(
                            "STUDENT ERP PORTAL",
                            titleFont
                    );

            title.setAlignment(
                    Element.ALIGN_CENTER
            );

            document.add(title);

            Paragraph receiptTitle =
                    new Paragraph(
                            "FEE PAYMENT RECEIPT",
                            FontFactory.getFont(
                                    FontFactory.HELVETICA_BOLD,
                                    14
                            )
                    );

            receiptTitle.setAlignment(
                    Element.ALIGN_CENTER
            );

            document.add(receiptTitle);

            document.add(
                    new Paragraph(" ")
            );

            // =========================
            // STUDENT DETAILS
            // =========================

            PdfPTable studentTable =
                    new PdfPTable(2);

            studentTable.setWidthPercentage(
                    100
            );

            addRow(
                    studentTable,
                    "Receipt Number",
                    "REC-" + payment.getId()
            );

            addRow(
                    studentTable,
                    "Transaction ID",
                    payment.getTransactionId()
            );

            addRow(
                    studentTable,
                    "Student Name",
                    getStudentName(student)
            );

            addRow(
                    studentTable,
                    "Enrollment Number",
                    student.getEnrollmentNumber()
            );

            addRow(
                    studentTable,
                    "Course",
                    student.getCourse()
                            .getCourseName()
            );

            addRow(
                    studentTable,
                    "Semester",
                    String.valueOf(
                            student.getSemester()
                    )
            );

            addRow(
                    studentTable,
                    "Academic Year",
                    studentFee
                            .getFeeStructure()
                            .getAcademicYear()
            );

            document.add(studentTable);

            document.add(
                    new Paragraph(" ")
            );

            // =========================
            // PAYMENT DETAILS
            // =========================

            PdfPTable paymentTable =
                    new PdfPTable(2);

            paymentTable.setWidthPercentage(
                    100
            );

            addRow(
                    paymentTable,
                    "Fee Type",
                    studentFee
                            .getFeeStructure()
                            .getFeeType()
                            .name()
            );

            addRow(
                    paymentTable,
                    "Payment Amount",
                    "Rs. " +
                            payment
                                    .getAmount()
                                    .toString()
            );

            addRow(
                    paymentTable,
                    "Total Fee",
                    "Rs. " +
                            studentFee
                                    .getTotalAmount()
                                    .toString()
            );

            addRow(
                    paymentTable,
                    "Total Paid",
                    "Rs. " +
                            studentFee
                                    .getPaidAmount()
                                    .toString()
            );

            addRow(
                    paymentTable,
                    "Remaining Due",
                    "Rs. " +
                            studentFee
                                    .getDueAmount()
                                    .toString()
            );

            addRow(
                    paymentTable,
                    "Payment Method",
                    payment
                            .getPaymentMethod()
                            .name()
            );

            addRow(
                    paymentTable,
                    "Payment Status",
                    payment
                            .getStatus()
                            .name()
            );

            addRow(
                    paymentTable,
                    "Payment Date",
                    payment
                            .getPaymentDate()
                            .toString()
            );

            document.add(paymentTable);

            document.add(
                    new Paragraph(" ")
            );

            Paragraph footer =
                    new Paragraph(
                            "This is a computer-generated receipt.",
                            FontFactory.getFont(
                                    FontFactory.HELVETICA,
                                    9
                            )
                    );

            footer.setAlignment(
                    Element.ALIGN_CENTER
            );

            document.add(footer);

            document.close();

            return outputStream.toByteArray();

        } catch (Exception e) {

            throw new RuntimeException(
                    "Unable to generate fee receipt",
                    e
            );
        }
    }

    private void addRow(
            PdfPTable table,
            String label,
            String value) {

        PdfPCell labelCell =
                new PdfPCell(
                        new Phrase(label)
                );

        PdfPCell valueCell =
                new PdfPCell(
                        new Phrase(
                                value == null
                                        ? ""
                                        : value
                        )
                );

        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    private String getStudentName(
            Student student) {

        String name =
                student.getFirstName();

        if (student.getLastName() != null &&
                !student.getLastName().isBlank()) {

            name +=
                    " " +
                    student.getLastName();
        }

        return name;
    }
}