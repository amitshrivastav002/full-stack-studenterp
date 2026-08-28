package com.erp.studenterp.config;

import com.erp.studenterp.entity.Course;
import com.erp.studenterp.entity.Department;
import com.erp.studenterp.entity.Subject;
import com.erp.studenterp.repository.CourseRepository;
import com.erp.studenterp.repository.DepartmentRepository;
import com.erp.studenterp.repository.SubjectRepository;

import lombok.RequiredArgsConstructor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Fills in the academic catalogue every other module is built on: without at
 * least one course and its subjects, nothing can be assigned - not a fee
 * structure, not a timetable, not an exam.
 *
 * <p>Each row is created only when it is missing, keyed on department name,
 * course name and subject code, so this tops up a half-filled database and is
 * a no-op on a database that already has the lot. Nothing is ever updated or
 * deleted, so an entry the office has edited by hand is left alone.
 */
@Component
@Order(20) // after AdminBootstrap, which has no ordering of its own
@RequiredArgsConstructor
public class AcademicsBootstrap implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AcademicsBootstrap.class);

    private final DepartmentRepository departmentRepository;
    private final CourseRepository courseRepository;
    private final SubjectRepository subjectRepository;

    /** key|name */
    private static final String DEPARTMENTS = """
            CSE|Computer Science & Engineering
            ECE|Electronics & Communication Engineering
            ME|Mechanical Engineering
            CE|Civil Engineering
            MGT|Management Studies
            BS|Basic Sciences
            """;

    /** key|name|duration in years|indicative fees */
    private static final String COURSES = """
            BTCSE|B.Tech Computer Science & Engineering|4|120000
            BTECE|B.Tech Electronics & Communication|4|115000
            BTME|B.Tech Mechanical Engineering|4|110000
            BTCE|B.Tech Civil Engineering|4|110000
            BCA|Bachelor of Computer Applications|3|75000
            MCA|Master of Computer Applications|2|90000
            BBA|Bachelor of Business Administration|3|70000
            MBA|Master of Business Administration|2|140000
            BSCPH|B.Sc Physics|3|45000
            """;

    /**
     * course key|department key|semester|subject code|subject name|credits
     *
     * <p>Subject codes are unique across the whole table, so every code is
     * prefixed with its course. B.Tech CSE is carried through all eight
     * semesters as a worked example; the rest cover the semesters students are
     * admitted into.
     */
    private static final String SUBJECTS = """
            BTCSE|CSE|1|CS101|Programming for Problem Solving|4
            BTCSE|BS|1|CS102|Engineering Mathematics I|4
            BTCSE|BS|1|CS103|Engineering Physics|4
            BTCSE|ECE|1|CS104|Basic Electrical and Electronics|3
            BTCSE|MGT|1|CS105|Communication Skills|2
            BTCSE|CSE|2|CS201|Data Structures|4
            BTCSE|BS|2|CS202|Engineering Mathematics II|4
            BTCSE|BS|2|CS203|Engineering Chemistry|4
            BTCSE|CSE|2|CS204|Object Oriented Programming|4
            BTCSE|ME|2|CS205|Engineering Graphics|3
            BTCSE|CSE|3|CS301|Discrete Mathematics|4
            BTCSE|CSE|3|CS302|Computer Organisation and Architecture|4
            BTCSE|CSE|3|CS303|Design and Analysis of Algorithms|4
            BTCSE|CSE|3|CS304|Database Management Systems|4
            BTCSE|CSE|3|CS305|Operating Systems|4
            BTCSE|CSE|4|CS401|Theory of Computation|4
            BTCSE|CSE|4|CS402|Computer Networks|4
            BTCSE|CSE|4|CS403|Software Engineering|4
            BTCSE|ECE|4|CS404|Microprocessors and Interfacing|3
            BTCSE|BS|4|CS405|Probability and Statistics|3
            BTCSE|CSE|5|CS501|Compiler Design|4
            BTCSE|CSE|5|CS502|Web Technologies|4
            BTCSE|CSE|5|CS503|Artificial Intelligence|4
            BTCSE|CSE|5|CS504|Computer Graphics|3
            BTCSE|MGT|5|CS505|Professional Ethics and Values|2
            BTCSE|CSE|6|CS601|Machine Learning|4
            BTCSE|CSE|6|CS602|Cloud Computing|4
            BTCSE|CSE|6|CS603|Information Security|4
            BTCSE|CSE|6|CS604|Mobile Application Development|3
            BTCSE|CSE|6|CS605|Data Warehousing and Mining|3
            BTCSE|CSE|7|CS701|Big Data Analytics|4
            BTCSE|CSE|7|CS702|Internet of Things|4
            BTCSE|CSE|7|CS703|Deep Learning|4
            BTCSE|CSE|7|CS704|Minor Project|4
            BTCSE|MGT|7|CS705|Entrepreneurship Development|2
            BTCSE|CSE|8|CS801|Distributed Systems|4
            BTCSE|CSE|8|CS802|Blockchain Technology|3
            BTCSE|CSE|8|CS803|Major Project|8
            BTCSE|MGT|8|CS804|Industrial Training and Seminar|2
            BTECE|ECE|1|EC101|Electronic Devices and Circuits|4
            BTECE|BS|1|EC102|Engineering Mathematics I|4
            BTECE|BS|1|EC103|Engineering Physics|4
            BTECE|CSE|1|EC104|Programming Fundamentals|3
            BTECE|MGT|1|EC105|Communication Skills|2
            BTECE|ECE|2|EC201|Digital Electronics|4
            BTECE|BS|2|EC202|Engineering Mathematics II|4
            BTECE|ECE|2|EC203|Network Analysis|4
            BTECE|ECE|2|EC204|Signals and Systems|4
            BTECE|ME|2|EC205|Engineering Mechanics|3
            BTECE|ECE|3|EC301|Analog Communication|4
            BTECE|ECE|3|EC302|Electromagnetic Field Theory|4
            BTECE|ECE|3|EC303|Microprocessors and Microcontrollers|4
            BTECE|ECE|3|EC304|Control Systems|4
            BTECE|BS|3|EC305|Numerical Methods|3
            BTECE|ECE|4|EC401|Digital Signal Processing|4
            BTECE|ECE|4|EC402|Digital Communication|4
            BTECE|ECE|4|EC403|VLSI Design|4
            BTECE|ECE|4|EC404|Antenna and Wave Propagation|3
            BTECE|CSE|4|EC405|Embedded Systems|3
            BTME|ME|1|ME101|Engineering Mechanics|4
            BTME|BS|1|ME102|Engineering Mathematics I|4
            BTME|BS|1|ME103|Engineering Physics|4
            BTME|ME|1|ME104|Engineering Graphics|3
            BTME|MGT|1|ME105|Communication Skills|2
            BTME|ME|2|ME201|Thermodynamics|4
            BTME|BS|2|ME202|Engineering Mathematics II|4
            BTME|ME|2|ME203|Material Science and Metallurgy|4
            BTME|ME|2|ME204|Manufacturing Processes|4
            BTME|ECE|2|ME205|Basic Electrical Engineering|3
            BTME|ME|3|ME301|Fluid Mechanics|4
            BTME|ME|3|ME302|Strength of Materials|4
            BTME|ME|3|ME303|Theory of Machines|4
            BTME|ME|3|ME304|Machine Drawing|3
            BTME|BS|3|ME305|Numerical Methods|3
            BTME|ME|4|ME401|Heat and Mass Transfer|4
            BTME|ME|4|ME402|Design of Machine Elements|4
            BTME|ME|4|ME403|Internal Combustion Engines|4
            BTME|ME|4|ME404|Industrial Engineering|3
            BTME|ME|4|ME405|Computer Aided Design|3
            BTCE|CE|1|CE101|Surveying I|4
            BTCE|BS|1|CE102|Engineering Mathematics I|4
            BTCE|BS|1|CE103|Engineering Physics|4
            BTCE|CE|1|CE104|Building Materials and Construction|4
            BTCE|MGT|1|CE105|Communication Skills|2
            BTCE|CE|2|CE201|Strength of Materials|4
            BTCE|BS|2|CE202|Engineering Mathematics II|4
            BTCE|CE|2|CE203|Fluid Mechanics|4
            BTCE|CE|2|CE204|Concrete Technology|4
            BTCE|ME|2|CE205|Engineering Graphics|3
            BCA|CSE|1|BCA101|Fundamentals of Computers|4
            BCA|CSE|1|BCA102|Programming in C|4
            BCA|BS|1|BCA103|Mathematics for Computing|4
            BCA|MGT|1|BCA104|Business Communication|3
            BCA|CSE|2|BCA201|Data Structures using C|4
            BCA|CSE|2|BCA202|Digital Logic and Computer Design|4
            BCA|CSE|2|BCA203|Object Oriented Programming with C++|4
            BCA|BS|2|BCA204|Discrete Mathematics|3
            BCA|CSE|3|BCA301|Database Management Systems|4
            BCA|CSE|3|BCA302|Operating Systems|4
            BCA|CSE|3|BCA303|Java Programming|4
            BCA|MGT|3|BCA304|Financial Accounting|3
            BCA|CSE|4|BCA401|Web Development|4
            BCA|CSE|4|BCA402|Computer Networks|4
            BCA|CSE|4|BCA403|Software Engineering|4
            BCA|CSE|4|BCA404|Python Programming|4
            MCA|CSE|1|MCA101|Advanced Data Structures|4
            MCA|CSE|1|MCA102|Advanced Database Systems|4
            MCA|CSE|1|MCA103|Object Oriented Analysis and Design|4
            MCA|BS|1|MCA104|Discrete Mathematical Structures|4
            MCA|CSE|2|MCA201|Design and Analysis of Algorithms|4
            MCA|CSE|2|MCA202|Operating Systems Concepts|4
            MCA|CSE|2|MCA203|Advanced Java Programming|4
            MCA|CSE|2|MCA204|Computer Networks and Security|4
            MCA|CSE|3|MCA301|Machine Learning|4
            MCA|CSE|3|MCA302|Cloud and Distributed Computing|4
            MCA|CSE|3|MCA303|Full Stack Development|4
            MCA|MGT|3|MCA304|Software Project Management|3
            MCA|CSE|4|MCA401|Artificial Intelligence|4
            MCA|CSE|4|MCA402|Data Science and Analytics|4
            MCA|CSE|4|MCA403|Major Project|8
            MCA|MGT|4|MCA404|Professional Ethics|2
            BBA|MGT|1|BBA101|Principles of Management|4
            BBA|MGT|1|BBA102|Financial Accounting|4
            BBA|MGT|1|BBA103|Business Economics|4
            BBA|MGT|1|BBA104|Business Communication|3
            BBA|MGT|2|BBA201|Organisational Behaviour|4
            BBA|MGT|2|BBA202|Marketing Management|4
            BBA|MGT|2|BBA203|Business Statistics|4
            BBA|CSE|2|BBA204|Computer Applications in Business|3
            MBA|MGT|1|MBA101|Management Concepts and Practices|4
            MBA|MGT|1|MBA102|Managerial Economics|4
            MBA|MGT|1|MBA103|Accounting for Managers|4
            MBA|MGT|1|MBA104|Quantitative Techniques|4
            MBA|MGT|2|MBA201|Marketing Management|4
            MBA|MGT|2|MBA202|Financial Management|4
            MBA|MGT|2|MBA203|Human Resource Management|4
            MBA|MGT|2|MBA204|Operations Management|4
            MBA|MGT|3|MBA301|Strategic Management|4
            MBA|MGT|3|MBA302|Business Research Methods|4
            MBA|MGT|3|MBA303|Consumer Behaviour|3
            MBA|CSE|3|MBA304|Management Information Systems|3
            MBA|MGT|4|MBA401|International Business|4
            MBA|MGT|4|MBA402|Entrepreneurship Development|3
            MBA|MGT|4|MBA403|Business Ethics and Corporate Governance|3
            MBA|MGT|4|MBA404|Dissertation|8
            BSCPH|BS|1|PHY101|Mechanics and Properties of Matter|4
            BSCPH|BS|1|PHY102|Mathematical Physics I|4
            BSCPH|BS|1|PHY103|Chemistry Fundamentals|3
            BSCPH|MGT|1|PHY104|Communication Skills|2
            BSCPH|BS|2|PHY201|Electricity and Magnetism|4
            BSCPH|BS|2|PHY202|Mathematical Physics II|4
            BSCPH|BS|2|PHY203|Thermal Physics|4
            BSCPH|CSE|2|PHY204|Computational Physics|3
            """;

    @Override
    @Transactional
    public void run(String... args) {
        Map<String, Department> departments = seedDepartments();
        Map<String, Course> courses = seedCourses();
        seedSubjects(departments, courses);
    }

    private Map<String, Department> seedDepartments() {
        Map<String, Department> byKey = new LinkedHashMap<>();
        int added = 0;

        for (String[] row : rows(DEPARTMENTS)) {
            String key = row[0];
            String name = row[1];

            Optional<Department> existing = departmentRepository.findByDepartmentName(name);
            if (existing.isPresent()) {
                byKey.put(key, existing.get());
                continue;
            }

            Department department = new Department();
            department.setDepartmentName(name);
            department.setDepartmentCode(key);
            byKey.put(key, departmentRepository.save(department));
            added++;
        }

        if (added > 0) log.info("Seeded {} department(s)", added);
        return byKey;
    }

    private Map<String, Course> seedCourses() {
        Map<String, Course> byKey = new LinkedHashMap<>();
        int added = 0;

        for (String[] row : rows(COURSES)) {
            String key = row[0];
            String name = row[1];

            Optional<Course> existing = courseRepository.findByCourseName(name);
            if (existing.isPresent()) {
                byKey.put(key, existing.get());
                continue;
            }

            Course course = new Course();
            course.setCourseName(name);
            course.setDuration(Integer.parseInt(row[2]));
            course.setFees(Double.parseDouble(row[3]));
            byKey.put(key, courseRepository.save(course));
            added++;
        }

        if (added > 0) log.info("Seeded {} course(s)", added);
        return byKey;
    }

    private void seedSubjects(Map<String, Department> departments, Map<String, Course> courses) {
        int added = 0;

        for (String[] row : rows(SUBJECTS)) {
            String subjectCode = row[3];
            if (subjectRepository.existsBySubjectCode(subjectCode)) continue;

            Course course = courses.get(row[0]);
            Department department = departments.get(row[1]);
            if (course == null || department == null) {
                // Only reachable if a seed row names a course or department that
                // was renamed by hand; skipping beats failing the whole startup.
                log.warn("Skipped subject {}: unknown course '{}' or department '{}'",
                        subjectCode, row[0], row[1]);
                continue;
            }

            Subject subject = new Subject();
            subject.setSubjectCode(subjectCode);
            subject.setSubjectName(row[4]);
            subject.setSemester(Integer.parseInt(row[2]));
            subject.setCredits(Integer.parseInt(row[5]));
            subject.setActive(true);
            subject.setCourse(course);
            subject.setDepartment(department);
            subjectRepository.save(subject);
            added++;
        }

        if (added > 0) log.info("Seeded {} subject(s)", added);
    }

    private static List<String[]> rows(String block) {
        List<String[]> parsed = new ArrayList<>();
        block.lines()
                .map(String::trim)
                .filter(line -> !line.isEmpty())
                .forEach(line -> parsed.add(line.split("\\|")));
        return parsed;
    }
}
