
function login(){
let email = document.getElementById("email").value;
let pass = document.getElementById("password").value;

if(email==="admin@shreevari.com" && pass==="123456"){
window.location="admin.html";
}else{
alert("Invalid Login");
}
}
