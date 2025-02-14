document.addEventListener("DOMContentLoaded", async function () {
    await loadModel();
});

let output = "";
const modelURL = "https://teachablemachine.withgoogle.com/models/cWDmYkcUn/model.json";
const metadataURL = "https://teachablemachine.withgoogle.com/models/cWDmYkcUn/metadata.json";
let model;

// Load Teachable Machine model
async function loadModel() {
    try {
        model = await tmImage.load(modelURL, metadataURL);
        console.log("Model loaded successfully.");
    } catch (error) {
        console.error("Error loading model:", error);
    }
}

function updateFont(script) {
    const elements = [document.getElementById("inputText"), document.getElementById("outputText")];
    const fontClasses = ["grantha-text", "tamil-text", "devanagari-text", "roman-text"];
    
    elements.forEach(el => {
        el.classList.remove(...fontClasses);
        el.classList.add(`${script.toLowerCase()}-text`);
    });
}

document.getElementById("sourceScript").addEventListener("change", function() {
    updateFont(this.value);
});

document.getElementById("targetScript").addEventListener("change", function() {
    updateFont(this.value);
});

// Swap source and target script values
function swapScripts() {
    const sourceScript = document.getElementById("sourceScript");
    const targetScript = document.getElementById("targetScript");
    [sourceScript.value, targetScript.value] = [targetScript.value, sourceScript.value];
}

// Transliterate text using API
async function transliterate() {
    const inputText = document.getElementById("inputText").value.trim();
    const sourceScript = document.getElementById("sourceScript").value;
    const targetScript = document.getElementById("targetScript").value;

    if (!inputText) {
        alert("Please enter some text.");
        return;
    }

    try {
        const response = await fetch(
            `https://aksharamukha-plugin.appspot.com/api/public?source=${sourceScript}&target=${targetScript}&text=${encodeURIComponent(inputText)}`
        );
        const result = await response.text();

        output = result;
        document.getElementById("outputText").textContent = result;
        updateFont(targetScript);
    } catch (error) {
        alert("An error occurred while fetching the result. Please try again.");
        console.error(error);
    }
}

// Download transliterated output as a text file
function downloadOutput() {
    if (!output) {
        alert("No output to download.");
        return;
    }
    const blob = new Blob([output], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "output.txt";
    link.click();
}

// Predict character from uploaded image using Teachable Machine model
async function predict() {
    const fileInput = document.getElementById("imageUpload");
    const uploadedImage = document.getElementById("uploadedImage");
    const labelContainer = document.getElementById("label-container");

    if (!fileInput.files.length) {
        alert("Please upload an image.");
        return;
    }

    const reader = new FileReader();
    reader.onload = async function (event) {
        uploadedImage.src = event.target.result;
        uploadedImage.classList.remove("hidden");
        
        const img = new Image();
        img.src = event.target.result;
        img.onload = async function () {
            if (!model) {
                alert("Model is not loaded yet. Please wait.");
                return;
            }

            const prediction = await model.predict(img);
            const highestPrediction = prediction.reduce((max, p) => (p.probability > max.probability ? p : max), prediction[0]);

            const tamilMapping = {
                "a": "அ", "aa": "ஆ", "ai": "ஐ", "cha": "ச", "e": "எ", "ee": "ஏ",
                "i": "இ", "ii": "ஈ", "ka": "க", "la": "ல", "lla": "ள", "ma": "ம",
                "na": "ந", "nga": "ங", "nja": "ஞ", "nna": "ண", "nnna": "ன", "o": "ஒ",
                "oo": "ஓ", "pa": "ப", "ra": "ர", "rra": "ற", "ta": "த", "tha": "தா",
                "u": "உ", "uu": "ஊ", "va": "வ", "ya": "ய", "zha": "ழ"
            };

            const tamilChar = tamilMapping[highestPrediction.className] || highestPrediction.className;
            labelContainer.innerHTML = `<p>${tamilChar}: ${highestPrediction.probability.toFixed(2)}</p>`;
        };
    };
    reader.readAsDataURL(fileInput.files[0]);
}
