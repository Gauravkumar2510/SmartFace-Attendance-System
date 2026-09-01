import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

import {
  Users,
  UserCheck,
  UserX,
  BarChart3,
  Plus,
  Trash2,
  Download,
  Camera,
  ScanFace,
  Video,
  VideoOff,
  LayoutDashboard,
  GraduationCap,
  ClipboardCheck,
  RefreshCw,
  Menu,
  X,
  Activity,
  ShieldCheck,
  Clock3,
  Search,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

// =====================================================
// BACKEND API
// =====================================================

const API = "http://127.0.0.1:8000";

// =====================================================
// MAIN APP
// =====================================================

export default function App() {
  // =====================================================
  // STATE
  // =====================================================

  const [stats, setStats] = useState({
    total_students: 0,
    present_today: 0,
    absent_today: 0,
    attendance_rate: 0,
  });

  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);

  const [form, setForm] = useState({
    name: "",
    roll_number: "",
    branch: "CSE",
    semester: "8",
  });

  const [selectedStudent, setSelectedStudent] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  const [activeSection, setActiveSection] =
    useState("dashboard");

  const [mobileMenu, setMobileMenu] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  // =====================================================
  // CAMERA STATE
  // =====================================================

  const [cameraOpen, setCameraOpen] =
    useState(false);

  const [cameraMessage, setCameraMessage] =
    useState("Camera is currently stopped.");

  const [recognizedStudent, setRecognizedStudent] =
    useState(null);

  // =====================================================
  // REFS
  // =====================================================

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const cameraActiveRef = useRef(false);
  const recognitionBusyRef = useRef(false);

  const studentsRef = useRef([]);

  // =====================================================
  // UPDATE STUDENTS REF
  // =====================================================

  useEffect(() => {
    studentsRef.current = students;
  }, [students]);

  // =====================================================
  // LOAD ALL DATA
  // =====================================================

  const load = async () => {
    try {
      setLoading(true);

      const [
        statsResponse,
        studentsResponse,
        attendanceResponse,
      ] = await Promise.all([
        axios.get(`${API}/api/stats`),
        axios.get(`${API}/api/students`),
        axios.get(`${API}/api/attendance`),
      ]);

      setStats(statsResponse.data);

      setStudents(
        Array.isArray(studentsResponse.data)
          ? studentsResponse.data
          : []
      );

      setAttendance(
        Array.isArray(attendanceResponse.data)
          ? attendanceResponse.data
          : []
      );

      studentsRef.current =
        Array.isArray(studentsResponse.data)
          ? studentsResponse.data
          : [];

    } catch (error) {
      console.error("Load error:", error);

      setMessage(
        error.response?.data?.detail ||
          "Backend se connection nahi ho raha. Backend check karo."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    load();
  }, []);

  // =====================================================
  // CLEANUP CAMERA
  // =====================================================

  useEffect(() => {
    return () => {
      cameraActiveRef.current = false;

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        streamRef.current = null;
      }
    };
  }, []);

  // =====================================================
  // ADD STUDENT
  // =====================================================

  const addStudent = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setMessage("Student name enter karo.");
      return;
    }

    if (!form.roll_number.trim()) {
      setMessage("Roll number enter karo.");
      return;
    }

    if (!form.branch.trim()) {
      setMessage("Branch enter karo.");
      return;
    }

    if (!form.semester.trim()) {
      setMessage("Semester enter karo.");
      return;
    }

    try {
      setLoading(true);

      await axios.post(
        `${API}/api/students`,
        {
          name: form.name.trim(),
          roll_number: form.roll_number.trim(),
          branch: form.branch.trim(),
          semester: form.semester.trim(),
        }
      );

      setForm({
        name: "",
        roll_number: "",
        branch: "CSE",
        semester: "8",
      });

      setMessage(
        "Student successfully added."
      );

      await load();

    } catch (error) {
      console.error(
        "Add student error:",
        error
      );

      setMessage(
        error.response?.data?.detail ||
          "Student add nahi ho paya."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // DELETE STUDENT
  // =====================================================

  const remove = async (id) => {
    const confirmed = window.confirm(
      "Kya aap is student ko delete karna chahte ho?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      await axios.delete(
        `${API}/api/students/${id}`
      );

      setMessage(
        "Student deleted successfully."
      );

      await load();

    } catch (error) {
      console.error(
        "Delete error:",
        error
      );

      setMessage(
        error.response?.data?.detail ||
          "Student delete nahi ho paya."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // MANUAL ATTENDANCE
  // =====================================================

  const mark = async (id) => {
    try {
      setLoading(true);

      await axios.post(
        `${API}/api/attendance`,
        {
          student_id: Number(id),
        }
      );

      setMessage(
        "Attendance marked successfully."
      );

      await load();

    } catch (error) {
      console.error(
        "Attendance error:",
        error
      );

      setMessage(
        error.response?.data?.detail ||
          "Attendance mark nahi ho payi."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // REGISTER FACE
  // =====================================================

  const registerFace = async () => {
    const input =
      document.getElementById("faceUpload");

    if (!selectedStudent) {
      setMessage(
        "Pehle student select karo."
      );
      return;
    }

    if (
      !input ||
      !input.files ||
      !input.files[0]
    ) {
      setMessage(
        "Clear single-face image select karo."
      );
      return;
    }

    const data = new FormData();

    data.append(
      "file",
      input.files[0]
    );

    try {
      setLoading(true);

      const response =
        await axios.post(
          `${API}/api/students/${selectedStudent}/register-face`,
          data,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );

      setMessage(
        response.data?.message ||
          "Face registered successfully."
      );

    } catch (error) {
      console.error(
        "Face registration error:",
        error
      );

      setMessage(
        error.response?.data?.detail ||
          "Face registration failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // IMAGE RECOGNITION
  // =====================================================

  const recognize = async () => {
    const input =
      document.getElementById(
        "recognizeUpload"
      );

    if (
      !input ||
      !input.files ||
      !input.files[0]
    ) {
      setMessage(
        "Recognition image select karo."
      );
      return;
    }

    const data = new FormData();

    data.append(
      "file",
      input.files[0]
    );

    try {
      setLoading(true);

      const response =
        await axios.post(
          `${API}/api/recognize`,
          data,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );

      const result = response.data;

      handleRecognitionResult(result);

      const matches =
        result?.matches || [];

      const matched =
        matches.find(
          (item) =>
            item.student_id !== null &&
            item.student_id !== undefined
        );

      if (matched) {
        setMessage(
          "Face recognized aur attendance process ho gayi."
        );
      } else {
        setMessage(
          "No registered face matched."
        );
      }

      await load();

    } catch (error) {
      console.error(
        "Recognition error:",
        error
      );

      setMessage(
        error.response?.data?.detail ||
          "Face recognition failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // HANDLE RECOGNITION RESULT
  // =====================================================

  const handleRecognitionResult =
    (result) => {
      const matches =
        result?.matches || [];

      const matched =
        matches.find(
          (item) =>
            item.student_id !== null &&
            item.student_id !== undefined
        );

      if (!matched) {
        setRecognizedStudent(null);
        return;
      }

      const student =
        studentsRef.current.find(
          (item) =>
            Number(item.id) ===
            Number(matched.student_id)
        );

      if (!student) {
        return;
      }

      setRecognizedStudent({
        name: student.name,
        roll_number:
          student.roll_number,
        branch: student.branch,
        distance:
          matched.distance,
      });
    };

  // =====================================================
  // CAPTURE LIVE CAMERA FRAME
  // =====================================================

  const captureFrame =
    async () => {
      if (
        !cameraActiveRef.current
      ) {
        return;
      }

      if (
        recognitionBusyRef.current
      ) {
        return;
      }

      const video =
        videoRef.current;

      const canvas =
        canvasRef.current;

      if (!video || !canvas) {
        return;
      }

      if (video.readyState < 2) {
        return;
      }

      if (
        video.videoWidth === 0 ||
        video.videoHeight === 0
      ) {
        return;
      }

      recognitionBusyRef.current =
        true;

      try {
        canvas.width =
          video.videoWidth;

        canvas.height =
          video.videoHeight;

        const context =
          canvas.getContext(
            "2d"
          );

        if (!context) {
          return;
        }

        context.drawImage(
          video,
          0,
          0,
          canvas.width,
          canvas.height
        );

        const blob =
          await new Promise(
            (resolve) => {
              canvas.toBlob(
                resolve,
                "image/jpeg",
                0.75
              );
            }
          );

        if (!blob) {
          return;
        }

        const data =
          new FormData();

        data.append(
          "file",
          blob,
          "camera-frame.jpg"
        );

        const response =
          await axios.post(
            `${API}/api/recognize`,
            data,
            {
              headers: {
                "Content-Type":
                  "multipart/form-data",
              },
            }
          );

        const result =
          response.data;

        const matches =
          result?.matches || [];

        const matched =
          matches.find(
            (item) =>
              item.student_id !== null &&
              item.student_id !== undefined
          );

        if (matched) {
          const student =
            studentsRef.current.find(
              (item) =>
                Number(item.id) ===
                Number(
                  matched.student_id
                )
            );

          if (student) {
            setRecognizedStudent({
              name: student.name,
              roll_number:
                student.roll_number,
              branch: student.branch,
              distance:
                matched.distance,
            });

            setCameraMessage(
              `✓ ${student.name} (${student.roll_number}) recognized`
            );

            await load();
          }
        } else {
          setRecognizedStudent(null);

          setCameraMessage(
            "Searching for a registered face..."
          );
        }

      } catch (error) {
        console.error(
          "Live recognition error:",
          error.response?.data ||
            error.message ||
            error
        );

        setCameraMessage(
          "Recognition request failed."
        );
      } finally {
        recognitionBusyRef.current =
          false;
      }
    };

  // =====================================================
  // START CAMERA
  // =====================================================

  const startCamera =
    async () => {
      try {
        if (
          !navigator.mediaDevices ||
          !navigator.mediaDevices
            .getUserMedia
        ) {
          setCameraMessage(
            "Camera browser me supported nahi hai."
          );
          return;
        }

        if (streamRef.current) {
          streamRef.current
            .getTracks()
            .forEach(
              (track) =>
                track.stop()
            );

          streamRef.current = null;
        }

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: {
                width: {
                  ideal: 640,
                },
                height: {
                  ideal: 480,
                },
                facingMode:
                  "user",
              },
              audio: false,
            }
          );

        streamRef.current =
          stream;

        cameraActiveRef.current =
          true;

        setCameraOpen(true);

        setRecognizedStudent(
          null
        );

        setCameraMessage(
          "Camera started. Looking for a registered face..."
        );

        if (videoRef.current) {
          videoRef.current.srcObject =
            stream;

          await videoRef.current.play();
        }

        const recognitionLoop =
          async () => {
            if (
              !cameraActiveRef.current
            ) {
              return;
            }

            await captureFrame();

            if (
              cameraActiveRef.current
            ) {
              setTimeout(
                recognitionLoop,
                2500
              );
            }
          };

        setTimeout(
          recognitionLoop,
          1200
        );

      } catch (error) {
        console.error(
          "Camera start error:",
          error
        );

        cameraActiveRef.current =
          false;

        setCameraOpen(false);

        if (
          error.name ===
          "NotAllowedError"
        ) {
          setCameraMessage(
            "Camera permission denied. Browser settings se camera allow karo."
          );
        } else if (
          error.name ===
          "NotFoundError"
        ) {
          setCameraMessage(
            "Camera device nahi mila."
          );
        } else {
          setCameraMessage(
            "Camera start nahi ho paya."
          );
        }
      }
    };

  // =====================================================
  // STOP CAMERA
  // =====================================================

  const stopCamera =
    () => {
      cameraActiveRef.current =
        false;

      recognitionBusyRef.current =
        false;

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach(
            (track) =>
              track.stop()
          );

        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject =
          null;
      }

      setCameraOpen(false);

      setRecognizedStudent(
        null
      );

      setCameraMessage(
        "Camera is currently stopped."
      );
    };

  // =====================================================
  // FILTER STUDENTS
  // =====================================================

  const filteredStudents =
    students.filter(
      (student) => {
        const text =
          search
            .toLowerCase()
            .trim();

        if (!text) {
          return true;
        }

        return (
          student.name
            ?.toLowerCase()
            .includes(text) ||
          student.roll_number
            ?.toLowerCase()
            .includes(text) ||
          student.branch
            ?.toLowerCase()
            .includes(text)
        );
      }
    );

  // =====================================================
  // CHART DATA
  // =====================================================

  const chartData = [
    {
      name: "Today",
      present:
        stats.present_today || 0,
      absent:
        stats.absent_today || 0,
    },
  ];

  // =====================================================
  // NAVIGATION
  // =====================================================

  const goTo =
    (section) => {
      setActiveSection(
        section
      );

      setMobileMenu(
        false
      );

      setTimeout(() => {
        document
          .getElementById(
            section
          )
          ?.scrollIntoView({
            behavior:
              "smooth",
            block: "start",
          });
      }, 50);
    };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="appShell">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`sidebar ${
          mobileMenu
            ? "sidebarOpen"
            : ""
        }`}
      >

        <div className="brand">

          <div className="brandIcon">
            <ScanFace
              size={24}
            />
          </div>

          <div>
            <h2>
              SmartFace
            </h2>

            <span>
              Attendance AI
            </span>
          </div>

        </div>

        <nav className="sidebarNav">

          <button
            className={
              activeSection ===
              "dashboard"
                ? "navItem active"
                : "navItem"
            }
            onClick={() =>
              goTo(
                "dashboard"
              )
            }
          >
            <LayoutDashboard
              size={18}
            />
            Dashboard
          </button>

          <button
            className={
              activeSection ===
              "students"
                ? "navItem active"
                : "navItem"
            }
            onClick={() =>
              goTo(
                "students"
              )
            }
          >
            <GraduationCap
              size={18}
            />
            Students
          </button>

          <button
            className={
              activeSection ===
              "recognition"
                ? "navItem active"
                : "navItem"
            }
            onClick={() =>
              goTo(
                "recognition"
              )
            }
          >
            <ScanFace
              size={18}
            />
            Face Recognition
          </button>

          <button
            className={
              activeSection ===
              "live"
                ? "navItem active"
                : "navItem"
            }
            onClick={() =>
              goTo("live")
            }
          >
            <Video
              size={18}
            />
            Live Attendance
          </button>

          <button
            className={
              activeSection ===
              "attendance"
                ? "navItem active"
                : "navItem"
            }
            onClick={() =>
              goTo(
                "attendance"
              )
            }
          >
            <ClipboardCheck
              size={18}
            />
            Attendance
          </button>

        </nav>

        <div className="sidebarBottom">

          <div className="systemStatus">

            <span className="statusDot">
            </span>

            <div>
              <strong>
                System Online
              </strong>

              <small>
                AI recognition ready
              </small>
            </div>

          </div>

        </div>

      </aside>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="mainContent">

        {/* TOPBAR */}

        <div className="topbar">

          <button
            className="mobileMenuButton"
            onClick={() =>
              setMobileMenu(
                !mobileMenu
              )
            }
          >
            {mobileMenu ? (
              <X size={22} />
            ) : (
              <Menu size={22} />
            )}
          </button>

          <div className="topbarTitle">

            <span>
              ADMIN DASHBOARD
            </span>

            <h1>
              Smart Attendance Management
            </h1>

          </div>

          <div className="topbarActions">

            <button
              className="iconButton"
              onClick={load}
              title="Refresh"
            >
              <RefreshCw
                size={18}
                className={
                  loading
                    ? "spin"
                    : ""
                }
              />
            </button>

            <a
              className="exportButton"
              href={`${API}/api/attendance/export`}
            >
              <Download
                size={17}
              />
              Export CSV
            </a>

          </div>

        </div>

        {/* =================================================
            DASHBOARD
        ================================================= */}

        <section
          id="dashboard"
          className="contentSection"
        >

          <div className="welcomeSection">

            <div>

              <p className="eyebrow">
                AI • COMPUTER VISION
              </p>

              <h2>
                Good day, Admin 👋
              </h2>

              <p>
                Monitor student attendance
                and face recognition activity
                from one place.
              </p>

            </div>

            <div className="secureBadge">
              <ShieldCheck
                size={18}
              />
              Secure System
            </div>

          </div>

          {/* STATS */}

          <section className="cards">

            <StatCard
              icon={<Users />}
              label="Total Students"
              value={
                stats.total_students ??
                0
              }
            />

            <StatCard
              icon={
                <UserCheck />
              }
              label="Present Today"
              value={
                stats.present_today ??
                0
              }
              positive
            />

            <StatCard
              icon={
                <UserX />
              }
              label="Absent Today"
              value={
                stats.absent_today ??
                0
              }
            />

            <StatCard
              icon={
                <BarChart3 />
              }
              label="Attendance Rate"
              value={`${stats.attendance_rate ?? 0}%`}
              positive
            />

          </section>

          {/* ANALYTICS */}

          <div className="dashboardGrid">

            <section className="panel analyticsPanel">

              <div className="panelHeader">

                <div>

                  <h2>
                    Attendance Overview
                  </h2>

                  <p>
                    Today's attendance
                    performance
                  </p>

                </div>

                <div className="analyticsIcon">
                  <Activity
                    size={20}
                  />
                </div>

              </div>

              <div className="chartBox">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <AreaChart
                    data={
                      chartData
                    }
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={
                        false
                      }
                    />

                    <XAxis
                      dataKey="name"
                    />

                    <YAxis />

                    <Tooltip />

                    <Area
                      type="monotone"
                      dataKey="present"
                      stroke="#2563eb"
                      fill="#dbeafe"
                      strokeWidth={3}
                    />

                    <Area
                      type="monotone"
                      dataKey="absent"
                      stroke="#ef4444"
                      fill="#fee2e2"
                      strokeWidth={2}
                    />

                  </AreaChart>

                </ResponsiveContainer>

              </div>

            </section>

            {/* QUICK ACTIONS */}

            <section className="panel quickPanel">

              <h2>
                Quick Actions
              </h2>

              <p>
                Frequently used attendance
                operations.
              </p>

              <button
                onClick={() =>
                  goTo(
                    "students"
                  )
                }
              >
                <Plus size={18} />
                Add Student
              </button>

              <button
                onClick={() =>
                  goTo(
                    "recognition"
                  )
                }
              >
                <ScanFace
                  size={18}
                />
                Register Face
              </button>

              <button
                onClick={() =>
                  goTo("live")
                }
              >
                <Video
                  size={18}
                />
                Start Live Attendance
              </button>

            </section>

          </div>

        </section>

        {/* =================================================
            STUDENTS
        ================================================= */}

        <section
          id="students"
          className="contentSection"
        >

          <div className="sectionTitle">

            <div>

              <p className="eyebrow">
                MANAGEMENT
              </p>

              <h2>
                Student Management
              </h2>

              <p>
                Register and manage students.
              </p>

            </div>

          </div>

          <div className="grid">

            {/* REGISTER STUDENT */}

            <section className="panel">

              <div className="panelHeader">

                <div>

                  <h2>
                    Register Student
                  </h2>

                  <p>
                    Add a new student
                    record.
                  </p>

                </div>

                <div className="panelIcon">
                  <GraduationCap
                    size={20}
                  />
                </div>

              </div>

              <form
                onSubmit={
                  addStudent
                }
                className="professionalForm"
              >

                <input
                  type="text"
                  placeholder="Student name"
                  value={
                    form.name
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      name:
                        event.target
                          .value,
                    })
                  }
                  required
                />

                <input
                  type="text"
                  placeholder="Roll number"
                  value={
                    form.roll_number
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      roll_number:
                        event.target
                          .value,
                    })
                  }
                  required
                />

                <input
                  type="text"
                  placeholder="Branch"
                  value={
                    form.branch
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      branch:
                        event.target
                          .value,
                    })
                  }
                  required
                />

                <input
                  type="text"
                  placeholder="Semester"
                  value={
                    form.semester
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      semester:
                        event.target
                          .value,
                    })
                  }
                  required
                />

                <button
                  type="submit"
                  className="primaryButton"
                  disabled={
                    loading
                  }
                >
                  <Plus
                    size={17}
                  />
                  Add Student
                </button>

              </form>

            </section>

            {/* STUDENT TABLE */}

            <section className="panel studentPanel">

              <div className="panelHeader">

                <div>

                  <h2>
                    Students
                  </h2>

                  <p>
                    {students.length}{" "}
                    registered student(s)
                  </p>

                </div>

                <div className="searchBox">

                  <Search
                    size={16}
                  />

                  <input
                    placeholder="Search..."
                    value={
                      search
                    }
                    onChange={(event) =>
                      setSearch(
                        event.target
                          .value
                      )
                    }
                  />

                </div>

              </div>

              <div className="tableWrap">

                <table>

                  <thead>

                    <tr>
                      <th>
                        Name
                      </th>

                      <th>
                        Roll
                      </th>

                      <th>
                        Branch
                      </th>

                      <th>
                        Semester
                      </th>

                      <th>
                        Action
                      </th>
                    </tr>

                  </thead>

                  <tbody>

                    {filteredStudents.length ===
                    0 ? (

                      <tr>

                        <td
                          colSpan="5"
                          className="emptyState"
                        >
                          No students found.
                        </td>

                      </tr>

                    ) : (

                      filteredStudents.map(
                        (student) => (

                          <tr
                            key={
                              student.id
                            }
                          >

                            <td>
                              <strong>
                                {
                                  student.name
                                }
                              </strong>
                            </td>

                            <td>
                              {
                                student.roll_number
                              }
                            </td>

                            <td>
                              <span className="branchBadge">
                                {
                                  student.branch
                                }
                              </span>
                            </td>

                            <td>
                              {
                                student.semester
                              }
                            </td>

                            <td className="actions">

                              <button
                                className="small"
                                onClick={() =>
                                  mark(
                                    student.id
                                  )
                                }
                                disabled={
                                  loading
                                }
                              >
                                <UserCheck
                                  size={
                                    14
                                  }
                                />
                                Present
                              </button>

                              <button
                                className="danger"
                                onClick={() =>
                                  remove(
                                    student.id
                                  )
                                }
                              >
                                <Trash2
                                  size={
                                    15
                                  }
                                />
                              </button>

                            </td>

                          </tr>

                        )
                      )

                    )}

                  </tbody>

                </table>

              </div>

            </section>

          </div>

        </section>

        {/* =================================================
            FACE RECOGNITION
        ================================================= */}

        <section
          id="recognition"
          className="contentSection"
        >

          <div className="sectionTitle">

            <div>

              <p className="eyebrow">
                AI MODULE
              </p>

              <h2>
                Face Recognition
              </h2>

              <p>
                Register faces and recognize
                students automatically.
              </p>

            </div>

          </div>

          <section className="panel">

            <div className="faceTools">

              {/* REGISTER FACE */}

              <div className="faceToolCard">

                <div className="featureIcon">
                  <Camera
                    size={22}
                  />
                </div>

                <h3>
                  Register Student Face
                </h3>

                <p>
                  Upload one clear face
                  image for a student.
                </p>

                <label>
                  Select Student
                </label>

                <select
                  value={
                    selectedStudent
                  }
                  onChange={(event) =>
                    setSelectedStudent(
                      event.target
                        .value
                    )
                  }
                >

                  <option value="">
                    Select student
                  </option>

                  {students.map(
                    (student) => (

                      <option
                        key={
                          student.id
                        }
                        value={
                          student.id
                        }
                      >
                        {
                          student.name
                        }{" "}
                        —{" "}
                        {
                          student.roll_number
                        }
                      </option>

                    )
                  )}

                </select>

                <input
                  id="faceUpload"
                  type="file"
                  accept="image/*"
                />

                <button
                  type="button"
                  onClick={
                    registerFace
                  }
                  className="primaryButton"
                  disabled={
                    loading
                  }
                >
                  <Camera
                    size={17}
                  />
                  Register Face
                </button>

              </div>

              {/* IMAGE RECOGNITION */}

              <div className="faceToolCard">

                <div className="featureIcon purple">
                  <ScanFace
                    size={22}
                  />
                </div>

                <h3>
                  Recognize from Image
                </h3>

                <p>
                  Upload an image and
                  automatically mark attendance.
                </p>

                <label>
                  Recognition Image
                </label>

                <input
                  id="recognizeUpload"
                  type="file"
                  accept="image/*"
                />

                <button
                  type="button"
                  onClick={
                    recognize
                  }
                  className="secondaryButton"
                  disabled={
                    loading
                  }
                >
                  <ScanFace
                    size={17}
                  />
                  Recognize & Mark
                </button>

              </div>

            </div>

            {message && (
              <div className="notice">
                {message}
              </div>
            )}

          </section>

        </section>

        {/* =================================================
            LIVE CAMERA
        ================================================= */}

        <section
          id="live"
          className="contentSection"
        >

          <div className="sectionTitle">

            <div>

              <p className="eyebrow">
                REAL-TIME AI
              </p>

              <h2>
                Live Face Attendance
              </h2>

              <p>
                Automatically recognize
                registered students using
                your webcam.
              </p>

            </div>

            <div className="liveStatus">

              <span
                className={
                  cameraOpen
                    ? "statusDot active"
                    : "statusDot"
                }
              >
              </span>

              {cameraOpen
                ? "Camera Active"
                : "Camera Offline"}

            </div>

          </div>

          <section className="panel liveCameraPanel">

            <div className="liveCameraHeader">

              <div>

                <h2>
                  <Video
                    size={20}
                  />
                  Live Recognition
                </h2>

                <p className="muted">
                  Keep your face visible in
                  front of the camera.
                </p>

              </div>

              <div>

                {!cameraOpen ? (

                  <button
                    type="button"
                    onClick={
                      startCamera
                    }
                    className="cameraButton"
                  >
                    <Video
                      size={17}
                    />
                    Start Camera
                  </button>

                ) : (

                  <button
                    type="button"
                    onClick={
                      stopCamera
                    }
                    className="stopButton"
                  >
                    <VideoOff
                      size={17}
                    />
                    Stop Camera
                  </button>

                )}

              </div>

            </div>

            <div className="cameraArea">

              <video
                ref={videoRef}
                className={`cameraVideo ${
                  cameraOpen
                    ? "cameraActive"
                    : ""
                }`}
                muted
                playsInline
                autoPlay
              />

              {!cameraOpen && (

                <div className="cameraPlaceholder">

                  <Camera
                    size={48}
                  />

                  <h3>
                    Camera is Off
                  </h3>

                  <p>
                    Start camera to begin
                    automatic attendance.
                  </p>

                </div>

              )}

              {cameraOpen && (

                <div className="cameraOverlay">

                  <div className="scanFrame">
                  </div>

                  <span>
                    Scanning...
                  </span>

                </div>

              )}

            </div>

            <canvas
              ref={canvasRef}
              style={{
                display: "none",
              }}
            />

            <div className="cameraStatus">

              <div>

                <strong>
                  Recognition Status
                </strong>

                <p>
                  {cameraMessage}
                </p>

              </div>

              {recognizedStudent && (

                <div className="recognizedStudent">

                  <div className="recognizedIcon">
                    ✓
                  </div>

                  <div>

                    <span>
                      Recognized Student
                    </span>

                    <strong>
                      {
                        recognizedStudent.name
                      }
                    </strong>

                    <small>
                      Roll No:{" "}
                      {
                        recognizedStudent.roll_number
                      }
                    </small>

                  </div>

                </div>

              )}

            </div>

          </section>

        </section>

        {/* =================================================
            ATTENDANCE
        ================================================= */}

        <section
          id="attendance"
          className="contentSection"
        >

          <div className="sectionTitle">

            <div>

              <p className="eyebrow">
                RECORDS
              </p>

              <h2>
                Recent Attendance
              </h2>

              <p>
                Latest attendance records
                generated by the system.
              </p>

            </div>

            <div className="attendanceSummary">

              <Clock3
                size={18}
              />

              Today:{" "}
              {stats.present_today ||
                0}{" "}
              Present

            </div>

          </div>

          <section className="panel">

            <div className="tableWrap">

              <table>

                <thead>

                  <tr>

                    <th>
                      ID
                    </th>

                    <th>
                      Student ID
                    </th>

                    <th>
                      Date
                    </th>

                    <th>
                      Time
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Method
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {attendance.length ===
                  0 ? (

                    <tr>

                      <td
                        colSpan="6"
                        className="emptyState"
                      >
                        No attendance records
                        yet.
                      </td>

                    </tr>

                  ) : (

                    attendance.map(
                      (item) => (

                        <tr
                          key={
                            item.id
                          }
                        >

                          <td>
                            #{item.id}
                          </td>

                          <td>
                            {
                              item.student_id
                            }
                          </td>

                          <td>
                            {
                              item.date
                            }
                          </td>

                          <td>
                            {
                              item.time
                            }
                          </td>

                          <td>

                            <span className="badge">
                              {
                                item.status
                              }
                            </span>

                          </td>

                          <td>

                            <span className="methodBadge">
                              {
                                item.method
                              }
                            </span>

                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

          </section>

        </section>

        {/* FOOTER */}

        <footer className="appFooter">

          <div>

            <strong>
              SmartFace Attendance
            </strong>

            <span>
              AI-powered attendance
              management system
            </span>

          </div>

          <span>
            © 2026 SmartFace
          </span>

        </footer>

      </main>

    </div>
  );
}

// =====================================================
// STAT CARD
// =====================================================

function StatCard({
  icon,
  label,
  value,
  positive = false,
}) {
  return (
    <div className="statCard">

      <div
        className={`statIcon ${
          positive
            ? "positive"
            : ""
        }`}
      >
        {icon}
      </div>

      <div className="statInfo">

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

      </div>

    </div>
  );
}