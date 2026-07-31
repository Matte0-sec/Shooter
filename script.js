// HIER DEINE BILDER UND TEXTE EINFUEGEN.
// Lege Bilder z. B. im Ordner "bilder" ab und ersetze PLACEHOLDER_IMAGE durch "bilder/foto1.jpg".
// Fuer jede weitere Erinnerung einfach ein neues Objekt innerhalb der eckigen Klammern ergaenzen.
const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f9b7c7'/%3E%3Ctext x='400' y='320' text-anchor='middle' font-family='serif' font-size='170' fill='%23fff4f6'%3E%26%239999%3B%3C/text%3E%3C/svg%3E";

const memories = [
	{
		image: "Bilder/IMG-20260730-WA0028.jpg",
		text: "Es war eine schöne und lustige Zeit bis jetzt mit dir."
	},
	{
		image: "Bilder/IMG-20260730-WA0027.jpg",
		text: "Mit dir sind Ausflüge immer schön und lustig."
	},
	{
		image: "Bilder/IMG-20260730-WA0023.jpg",
		text: "Du geniesst jeden aaugenblick zusammen."
	},
	{
		image: "Bilder/IMG-20260730-WA0018.jpg",
		text: "An oster freuen wir uns immer auf die eier!! Danke viel mals das du dir die zeit nimmst!."
	},
	{
		image: "Bilder/IMG-20260730-WA0025.jpg",
		text: "An weinachten und auch sonst nimmst du dir immer die zeit für uns etwas leckeres zu kochen."
	},
	{
		image: "Bilder/IMG-20260730-WA0030.jpg",
		text: "Es ist immer schön mit dir zeit zu verbringen."
	},
	{
		image: "Bilder/IMG-20260730-WA0031.jpg",
		text: "Sogar bei kälte lachen wir zusammen und du kannst nicht wiederstehen bilder zu machen😂❤❤."
	}
];

const DISPLAY_DURATION = 10_000;

const heartButton = document.querySelector("#heart-button");
const memoryCard = document.querySelector("#memory-card");
const memoryImage = document.querySelector("#memory-image");
const memoryText = document.querySelector("#memory-text");
const memoryCount = document.querySelector("#memory-count");

let activeMemoryIndex = 0;
let rotationTimer;

function showMemory(index) {
	const memory = memories[index];
	memoryImage.src = memory.image;
	memoryText.textContent = memory.text;
	memoryCount.textContent = `Erinnerung ${index + 1} von ${memories.length}`;
}

function showNextMemory() {
	if (activeMemoryIndex >= memories.length - 1) {
		window.clearInterval(rotationTimer);
		return;
	}

	activeMemoryIndex += 1;
	showMemory(activeMemoryIndex);
}

heartButton.addEventListener("click", () => {
	if (!memoryCard.hidden) return;

	if (memories.length === 0) {
		memoryText.textContent = "Fuege zuerst deine Bilder und Texte in script.js ein.";
		memoryImage.removeAttribute("src");
		memoryCount.textContent = "Deine Erinnerungen";
	} else {
		showMemory(activeMemoryIndex);
	}

	memoryCard.hidden = false;
	heartButton.setAttribute("aria-expanded", "true");
	heartButton.classList.add("opened");
	window.clearInterval(rotationTimer);
	if (memories.length > 1) {
		rotationTimer = window.setInterval(showNextMemory, DISPLAY_DURATION);
	}
});
