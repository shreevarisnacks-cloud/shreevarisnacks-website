<script type="module">

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAPVRH8VPpDhGVMF6NZFs7SXFUDVADpmg8",
  authDomain: "shreevarisnacks-45d0d.firebaseapp.com",
  projectId: "shreevarisnacks-45d0d",
  storageBucket: "shreevarisnacks-45d0d.firebasestorage.app",
  messagingSenderId: "834301462418",
  appId: "1:834301462418:web:291d73b35f0b6c3d96634b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

window.login = function () {

  let email = document.getElementById("email").value;
  let pass = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, pass)
    .then(() => {
      window.location = "admin.html";
    })
    .catch((error) => {
      alert("Login Failed: " + error.message);
    });
};

</script>
