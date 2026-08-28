package com.erp.studenterp.dto;

import com.erp.studenterp.entity.Role;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** The signed-in user, flattened with whichever profile their role owns. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponse {

    private Long userId;

    private String fullName;

    private String email;

    private Role role;

    /** Set for students only. */
    private Long studentId;

    private String enrollmentNumber;

    private Integer semester;

    private String section;

    private String courseName;

    /** Set for faculty only. */
    private Long facultyId;

    private String employeeId;

    private String designation;

    /** Set for both students and faculty. */
    private String departmentName;

    private String mobileNumber;

    private String photoUrl;
}
