
function loginStudent() {
  const email = document.getElementById('studentEmail').value;
  const password = document.getElementById('studentPassword').value;
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(() => window.location.href = 'student-dashboard.html')
    .catch(e => alert(e.message));
}

function signupStudent() {
  const email = document.getElementById('studentEmail').value;
  const password = document.getElementById('studentPassword').value;
  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(() => window.location.href = 'student-dashboard.html')
    .catch(e => alert(e.message));
}
function startScanner() {
  const scanner = new Html5Qrcode("reader");

  Html5Qrcode.getCameras().then(devices => {
    console.log("devices= " + devices);
    if (devices.length) {
      console.log("hello");
      scanner.start(
        devices[0].id,
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          console.log("hii");
          scanner.stop(); // stop after 1 scan
          const sessionId = decodedText; // this is the unique session ID from QR
          const name = prompt("Enter your name:");
          const now = new Date();
          const entry = {
            name,
            date: now.toLocaleDateString(),
            time: now.toLocaleTimeString()
          };

          // Attendance key format: attendance_<QR_CONTENT>
          const key = "attendance_" + sessionId;
          let data = JSON.parse(localStorage.getItem(key)) || [];

          if (!data.find(d => d.name === name)) {
            data.push(entry);
            localStorage.setItem(key, JSON.stringify(data));
            document.getElementById("scanStatus").innerText = "✅ Attendance marked.";
          } else {
            document.getElementById("scanStatus").innerText = "⚠️ Already marked.";
          }
        },
        (err) => {
          console.warn("Scan error:", err);
        }
      );
    }
  }).catch(err => {
    console.error("Camera not found:", err);
  });
}
