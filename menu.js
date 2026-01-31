
fetch('data/menu.json')
.then(res => res.json())
.then(data => {
let menu = document.getElementById("menu");

data.forEach(item => {
menu.innerHTML += `
<div class="bg-white p-4 rounded shadow">
<h3 class="font-bold">${item.name}</h3>
<p>₹${item.price}</p>
<p class="text-sm">${item.category}</p>
</div>`;
});
});
