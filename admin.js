<script type="module">

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

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

window.addItem = async function () {

  let name = document.getElementById("name").value;
  let price = document.getElementById("price").value;
  let category = document.getElementById("category").value;

  await addDoc(collection(db, "menu"), {
    name,
    price,
    category
  });

  alert("Item Added Successfully!");
};

</script>
