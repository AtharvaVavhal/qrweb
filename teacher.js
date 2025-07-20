
function loginTeacher() {
  const email = document.getElementById('teacherEmail').value;
  const password = document.getElementById('teacherPassword').value;
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(() => window.location.href = 'teacher-dashboard.html')
    .catch(e => alert(e.message));
}

function generateQRCode() {
  const sessionId = "session_" + new Date().getTime();
  QRCode.toCanvas(document.getElementById("qrcode"), sessionId, function (error) {
    if (error) console.error(error);
  });
  localStorage.setItem("currentSession", sessionId);
  localStorage.setItem("attendance_" + sessionId, JSON.stringify([]));
}

function downloadAttendance() {
  const sessionId = localStorage.getItem("currentSession");
  const attendance = JSON.parse(localStorage.getItem("attendance_" + sessionId)) || [];
  let csv = "Name,Date,Time\n";
  attendance.forEach(entry => csv += `${entry.name},${entry.date},${entry.time}\n`);
  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `attendance_${sessionId}.csv`;
  link.click();
}
