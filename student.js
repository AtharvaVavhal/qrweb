// Function to display messages in a custom message box
function showMessage(message, type = 'info') {
  const messageBox = document.getElementById('messageBox');
  if (messageBox) {
    messageBox.innerText = message;
    messageBox.className = 'message-box ' + type; // Reset classes and add new type
    messageBox.style.display = 'block'; // Show the message box
    setTimeout(() => {
      messageBox.style.display = 'none'; // Hide after 5 seconds
    }, 5000);
  } else {
    console.error("Message box element not found!");
    // Fallback to console log if messageBox is not available
    if (type === 'error') {
      console.error(message);
    } else {
      console.log(message);
    }
  }
}

// Ensure Firebase is initialized before use
let firebaseApp;
let firebaseAuth;

document.addEventListener('DOMContentLoaded', () => {
  try {
    // __firebase_config and __app_id are provided by the Canvas environment
    const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    if (Object.keys(firebaseConfig).length > 0) {
      firebaseApp = firebase.initializeApp(firebaseConfig);
      firebaseAuth = firebase.auth();

      // Sign in anonymously if no custom token, or use custom token if provided
      if (typeof __initial_auth_token !== 'undefined') {
        firebaseAuth.signInWithCustomToken(__initial_auth_token)
          .then(() => {
            console.log("Firebase signed in with custom token.");
          })
          .catch((error) => {
            console.error("Error signing in with custom token:", error);
            showMessage("Authentication error. Please try again.", "error");
          });
      } else {
        firebaseAuth.signInAnonymously()
          .then(() => {
            console.log("Firebase signed in anonymously.");
          })
          .catch((error) => {
            console.error("Error signing in anonymously:", error);
            showMessage("Authentication error. Please try again.", "error");
          });
      }
    } else {
      showMessage("Firebase configuration missing. Please ensure firebase-config.js is correctly set up.", "error");
      console.error("Firebase configuration missing.");
    }
  } catch (e) {
    showMessage("Error initializing Firebase: " + e.message, "error");
    console.error("Firebase initialization error:", e);
  }
});


function loginStudent() {
  const email = document.getElementById('studentEmail').value;
  const password = document.getElementById('studentPassword').value;

  if (!firebaseAuth) {
    showMessage("Firebase not initialized. Please refresh the page.", "error");
    return;
  }

  firebaseAuth.signInWithEmailAndPassword(email, password)
    .then(() => {
      window.location.href = 'student-dashboard.html';
    })
    .catch(e => {
      showMessage("Login failed: " + e.message, "error");
      console.error("Student login error:", e);
    });
}

function signupStudent() {
  const email = document.getElementById('studentEmail').value;
  const password = document.getElementById('studentPassword').value;

  if (!firebaseAuth) {
    showMessage("Firebase not initialized. Please refresh the page.", "error");
    return;
  }

  firebaseAuth.createUserWithEmailAndPassword(email, password)
    .then(() => {
      showMessage("Signup successful! Redirecting to dashboard.", "info");
      window.location.href = 'student-dashboard.html';
    })
    .catch(e => {
      showMessage("Signup failed: " + e.message, "error");
      console.error("Student signup error:", e);
    });
}

function startScanner() {
  const scanner = new Html5Qrcode("reader");
  const scanStatusElement = document.getElementById("scanStatus");
  const readerElement = document.getElementById("reader");

  if (!scanStatusElement) {
    console.error("Scan status element not found!");
    return;
  }
  if (!readerElement) {
    console.error("Reader element not found!");
    return;
  }

  // Add scanner glow effect (if using a theme that supports it)
  // readerElement.classList.add('scanner-glow'); // Commented out for "most simple CSS"
  scanStatusElement.innerText = "Initializing scanner...";
  showMessage("Initializing camera...", "info");


  Html5Qrcode.getCameras().then(devices => {
    if (devices.length) {
      // Find a back camera if available
      const rearCamera = devices.find(device =>
        device.label.toLowerCase().includes('back') ||
        device.label.toLowerCase().includes('rear')
      );

      const cameraId = rearCamera ? rearCamera.id : devices[0].id; // Use back camera, else first camera

      scanner.start(
        cameraId, // Use the preferred camera ID
        { fps: 10, qrbox: 250 }, // Configuration for scanner
        (decodedText) => {
          // On successful scan
          scanner.stop().then(() => {
            // readerElement.classList.remove('scanner-glow'); // Commented out for "most simple CSS"
            const sessionId = decodedText; // This is the unique session ID from QR

            // Use a custom prompt for name, as window.prompt is not ideal in immersive iframes
            const name = prompt("Enter your name:"); // Keep prompt for now as custom modal is complex

            if (!name) {
              scanStatusElement.innerText = "❌ Attendance cancelled.";
              showMessage("Attendance marking cancelled. Name not provided.", "error");
              return;
            }

            const now = new Date();
            const entry = {
              name: name.trim(),
              date: now.toLocaleDateString(),
              time: now.toLocaleTimeString()
            };

            // Attendance key format: attendance_<QR_CONTENT>
            const key = "attendance_" + sessionId;
            let data = JSON.parse(localStorage.getItem(key)) || [];

            if (!data.find(d => d.name === entry.name)) {
              data.push(entry);
              localStorage.setItem(key, JSON.stringify(data));
              scanStatusElement.innerText = "✅ Attendance marked.";
              // scanStatusElement.classList.add('success-checkmark-bounce'); // Commented out for "most simple CSS"
              showMessage("Attendance marked successfully!", "info");
              // setTimeout(() => scanStatusElement.classList.remove('success-checkmark-bounce'), 600);
            } else {
              scanStatusElement.innerText = "⚠️ Already marked.";
              showMessage("You have already marked attendance for this session.", "info");
            }
          }).catch(err => {
            console.error("Error stopping scanner:", err);
            showMessage("Error stopping scanner.", "error");
          });
        },
        (err) => {
          // On scan error
          // console.warn("Scan error:", err); // Keep for debugging
          // Only show message for significant errors, not continuous warnings
          if (!err.includes("No QR code found")) { // Filter out common "no QR code" warnings
            scanStatusElement.innerText = "Scanning..."; // Keep scanning status
          }
        }
      ).catch(err => {
        // Error starting scanner (e.g., camera access denied)
        console.error("Error starting scanner:", err);
        scanStatusElement.innerText = "❌ Scanner failed to start.";
        // readerElement.classList.remove('scanner-glow'); // Commented out for "most simple CSS"
        showMessage("Failed to start scanner. Please ensure camera access is granted and no other app is using the camera.", "error");
      });
    } else {
      scanStatusElement.innerText = "❌ No camera found.";
      // readerElement.classList.remove('scanner-glow'); // Commented out for "most simple CSS"
      showMessage("No camera devices found on this device.", "error");
    }
  }).catch(err => {
    console.error("Error getting cameras:", err);
    scanStatusElement.innerText = "❌ Camera access denied or error.";
    // readerElement.classList.remove('scanner-glow'); // Commented out for "most simple CSS"
    showMessage("Failed to access camera. Please check permissions.", "error");
  });
}
