
fetch('data/offer.json')
.then(res => res.json())
.then(data => {
document.getElementById("offer").innerText = data.text;
});
