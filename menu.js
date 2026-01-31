<script type="module">

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAPVRH8VPpDhGVMF6NZFs7SXFUDVADpmg8",
  authDomain: "shreevarisnacks-45d0d.firebaseapp.com",
  projectId: "shreevarisnacks-45d0d",
  storageBucket: "shreevarisnacks-45d0d.firebasestorage.app",
  messagingSenderId: "834301462418",
  appId: "1:834301462418:web:291d73b35f0b6c3d96634b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const menuDiv = document.getElementById("menu");

async function loadMenu() {

  const snapshot = await getDocs(collection(db, "menu"));

  snapshot.forEach((doc) => {

    let item = doc.data();

    menuDiv.innerHTML += `
      <div class="bg-white p-4 rounded shadow">
        <h3 class="font-bold">${item.name}</h3>
        <p>₹${item.price}</p>
        <p>${item.category}</p>
      </div>
    `;

  });
}

loadMenu();

</script>
