import { useEffect, useState } from "react";
import { getStudentDashboard } from "../../services/studentService";

export default function StudentDashboard() {
  const [data, setData] = useState("");

  useEffect(() => {
    getStudentDashboard()
      .then(setData)
      .catch(console.error);
  }, []);

  return <h2>{data}</h2>;
}
