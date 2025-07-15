import {
  FilesetResolver,
  PoseLandmarker
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Load model image
const modelImg = new Image();
modelImg.src = "women.png";
modelImg.onerror = () => console.error("❌ Model image failed to load!");

let shirtImg = null;
let poseLandmarks = null;

// Initialize MediaPipe
async function setupPoseDetection() {
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    
    const landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
        delegate: "GPU"
      },
      runningMode: "IMAGE",
      numPoses: 1
    });
    
    return landmarker;
  } catch (err) {
    console.error("❌ Pose detector failed:", err);
    return null;
  }
}

// Detect pose when model image loads
modelImg.onload = async () => {
  canvas.width = modelImg.width;
  canvas.height = modelImg.height;
  ctx.drawImage(modelImg, 0, 0); // Draw the model image
  
  const landmarker = await setupPoseDetection();
  if (!landmarker) return;
  
  const result = await landmarker.detect(modelImg);
  console.log("Pose detection result:", result); // Debug
  
  if (result.landmarks.length > 0) {
    poseLandmarks = result.landmarks[0];
    console.log("✅ Pose detected!");
  } else {
    console.log("❌ No pose detected in the image.");
  }
};

// Handle shirt upload
document.getElementById("shirtUpload").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = () => {
    shirtImg = new Image();
    shirtImg.src = reader.result;
    shirtImg.onerror = () => console.error("❌ Shirt image failed to load!");
    
    shirtImg.onload = () => {
      if (!poseLandmarks) {
        console.log("❌ No pose landmarks available.");
        return;
      }
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(modelImg, 0, 0); // Redraw model
      
      const leftShoulder = poseLandmarks[11]; // Left shoulder (landmark 11)
      const rightShoulder = poseLandmarks[12]; // Right shoulder (landmark 12)
      
      const shirtWidth = Math.abs(rightShoulder.x - leftShoulder.x) * canvas.width * 1.5;
      const centerX = (leftShoulder.x + rightShoulder.x) / 2 * canvas.width;
      const topY = leftShoulder.y * canvas.height;
      
      ctx.drawImage(
        shirtImg,
        centerX - shirtWidth / 2,
        topY,
        shirtWidth,
        shirtWidth * 1.2
      );
    };
  };
  reader.readAsDataURL(file);
});