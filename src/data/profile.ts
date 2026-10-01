/**
 * SINGLE SOURCE OF TRUTH.
 *
 * Every personal fact on this site comes from this file. The UI and the AI
 * system prompt both read from here — nothing personal is hard-coded anywhere
 * else in the codebase.
 *
 * DO NOT embellish. The wording about learning stage, goals vs. completed work,
 * and the hackathon gap is deliberate: it is what keeps the site honest.
 *
 * `as const` is load-bearing — it preserves literal types so Status unions
 * stay narrow and the cards can switch exhaustively on `status`.
 */

export type Status = "completed" | "learning" | "goal";

export const profile = {
  name: "Adabala Bhavitha Veni",
  shortName: "Bhavitha",
  headline: "Information Technology Undergraduate",
  tagline: "Curious Learner | Creative Thinker",
  stage: "Fresher",
  email: "adabalabhavitha@gmail.com",
  linkedin: "https://linkedin.com/in/bhavithaadabala",
  github: "", // TODO: add GitHub URL
  codechef: "", // TODO: add CodeChef profile URL
  resumeUrl: "", // TODO: put resume.pdf in /public and set "/resume.pdf"

  about: [
    "I am an Information Technology undergraduate at Sasi Institute of Technology & Engineering, interested in exploring technology, learning new concepts, and understanding how ideas can become useful applications. I enjoy drawing, designing, and creating, and I prefer learning through practical work and clear, step-by-step understanding.",
    "My interests currently include Python, Java, HTML, CSS, databases, and UI/UX design. I am still exploring different areas of IT and working toward building practical skills, improving my confidence, and preparing for an entry-level opportunity after graduation.",
    "I value curiosity, patience, responsibility, creativity, and helping others. I believe progress matters more than perfection, and I want to keep exploring, learning, and improving.",
  ],

  snapshot: {
    currentStatus: "B.Tech Information Technology student (2024–2028)",
    careerDirection:
      "Exploring IT roles while preparing for a suitable entry-level opportunity",
    learningPreference: "Practical, project-based learning",
    programmingComfort: "Python (some comfort); basic Java and C",
  },

  education: [
    {
      level: "Bachelor of Technology — Information Technology",
      school: "Sasi Institute of Technology & Engineering",
      years: "2024–2028",
      results: ["First-year CGPA: 9.5", "Second-year CGPA: 8.6"],
      note: "First-year result came from consistent effort, understanding concepts, and learning how to present knowledge in examinations. In second year, core subjects such as Advanced Data Structures and Java Programming challenged my confidence, which encouraged me to strengthen fundamentals and focus on practical understanding.",
    },
    {
      level: "Intermediate — MPC",
      school: "Sasi Junior College, Palakollu",
      years: "2022–2024",
      results: ["Percentage: 92.5%"],
    },
    {
      level: "Secondary School Certificate",
      school: "Z.P.H. High School, Polavaram",
      years: "2021–2022",
      results: ["GPA: 89.2%"],
    },
  ],

  skillsDisclaimer:
    "This reflects my current learning stage, not a claim of advanced proficiency.",
  skills: [
    {
      area: "Python",
      status: "learning" as Status,
      detail: "Learning and practicing; the language I feel most comfortable using",
    },
    {
      area: "Java",
      status: "learning" as Status,
      detail: "Basic understanding",
    },
    {
      area: "C",
      status: "learning" as Status,
      detail:
        "Basic understanding; completed C learning and practice activities on CodeChef",
    },
    {
      area: "HTML and CSS",
      status: "learning" as Status,
      detail: "Learning and exploring web page structure and styling",
    },
    {
      area: "SQL / MySQL",
      status: "learning" as Status,
      detail: "Academic project exposure and database learning",
    },
    {
      area: "UI/UX design",
      status: "learning" as Status,
      detail: "Area of interest; developing design understanding",
    },
    {
      area: "Flutter / Dart",
      status: "learning" as Status,
      detail: "Exploring through an introductory BMI calculator learning exercise",
    },
  ],

  projects: [
    {
      slug: "attendance-management-system",
      title: "Attendance Management System",
      kind: "Team academic project · Completed at a basic level",
      stack: ["JSP", "JDBC", "MySQL", "XAMPP", "HTML"],
      summary:
        "An academic web application intended to organize attendance-related activities for students, faculty, and administrators.",
      implemented: [
        "Faculty and student login",
        "Student details management",
        "Department, course, and regulation management",
        "Attendance marking and viewing",
        "Dashboard pages",
        "MySQL database integration",
      ],
      perspective:
        "This project gave me exposure to connecting web pages with a database and organizing features around different user roles. I would like to improve it with a cleaner, more professional interface, clearer navigation, and role-specific options.",
      // Goals, NOT completed features.
      futureGoals: [
        "Refine page layouts and visual consistency",
        "Make navigation and actions clear for each role",
        "Improve organization of attendance and academic information",
        "Continue learning how to make the application more usable",
      ],
    },
    {
      slug: "bmi-calculator",
      title: "BMI Calculator",
      kind: "Individual introductory learning exercise · Flutter",
      stack: ["Flutter", "Dart"],
      summary:
        "A simple BMI calculator I tried while beginning to explore Flutter. The initial code was provided as a learning starting point, and I used it to start understanding how a Flutter application works.",
      futureGoals: [
        "Learn the structure and behavior of Flutter and Dart more deeply",
        "Understand how widgets and inputs work together",
        "Gradually build mobile applications with more independence",
      ],
    },
    {
      slug: "fintech-hackathon",
      title: "FinTech Hackathon — Faculty Paper-Correction Workload",
      kind: "Team participation",
      stack: [],
      summary:
        "Participated in a team hackathon focused on reducing faculty workload during paper correction. The concept explored how technology might make evaluation work more manageable. It introduced me to team-based problem exploration in an educational setting.",
      notProvided:
        "Individual responsibilities, prototype status, and outcomes were not provided — never state them.",
    },
  ],

  coding: [
    "Solved 500 problems on CodeChef, as recorded in my resume",
    "Completed the Learn C Programming lessons and projects on CodeChef",
    "Completed the associated C programming practice problems",
    "Practiced scenario-based programming questions and working through logical difficulties",
    "Currently trying to solve a LeetCode problem daily, starting with arrays",
    "Interested in learning Data Structures and Algorithms (DSA)",
  ],
  codingReflection:
    "Coding practice has helped me think about how to understand a problem, identify what it is asking, and develop an approach before writing a solution. I am continuing to improve my independent implementation skills.",

  strengths: [
    { name: "Creative thinking", text: "I enjoy drawing, designing, and imagining new ideas." },
    { name: "Willingness to learn", text: "I like exploring unfamiliar topics and building understanding." },
    { name: "Patience", text: "I prefer learning concepts clearly and step by step." },
    { name: "Responsibility", text: "I value dedication and completing the work I take on." },
    { name: "Helpful attitude", text: "I enjoy supporting people." },
    { name: "Self-learning", text: "I use practice and exploration to build knowledge." },
    { name: "Organization", text: "I appreciate clear structure and simple, usable presentation." },
  ],

  growth:
    "I learn best when I can apply a concept through a small practical project. I am working to improve my technical foundations, problem-solving, communication confidence, design skills, consistency, and time management. I sometimes hesitate to express my ideas, and I am making an effort to become more confident. I am exploring different IT paths rather than choosing a specialization before I understand the work involved.",

  fun: [
    "Drawing and sketching",
    "Clean, simple, and organized design",
    "Exploring new places and experiences",
    "Caring for plants and gardening",
    "Helping people",
    "Spending time with friends and family",
    "Exploring new technologies",
  ],

  goals: [
    "Strengthen programming fundamentals in Python, Java, and C",
    "Learn Data Structures and Algorithms",
    "Build small applications independently and understand each part of the implementation",
    "Improve HTML, CSS, database, and UI/UX skills",
    "Continue learning Flutter through practical exercises",
    "Improve communication and confidence when sharing ideas",
    "Practice problem-solving consistently",
    "Prepare for interviews, placements, and entry-level IT opportunities",
    "Explore technology roles and identify a direction that fits my abilities and interests",
    "Improve time management and maintain steady learning habits",
  ],

  careerObjective:
    "As an undergraduate fresher, my goal is to secure an entry-level opportunity in the IT industry where I can apply my academic foundation, learn from experienced people, contribute responsibly, and continue developing practical skills. I am open to exploring suitable roles while building a stronger understanding of technology and professional work.",

  motto: "Progress matters more than perfection.",
  languages: ["Telugu — Native", "English"],
} as const;

/* ---------- derived types, used by card components ---------- */

export type Project = (typeof profile.projects)[number];
export type Skill = (typeof profile.skills)[number];
export type Education = (typeof profile.education)[number];
export type Strength = (typeof profile.strengths)[number];

export function getProject(slug: string): Project | undefined {
  return profile.projects.find((p) => p.slug === slug);
}

export function hasLink(value: string): boolean {
  return value.trim().length > 0;
}