let cameraElement = document.getElementById('camera');
let videoContainer = document.getElementById('video-container');
let videoElement = document.getElementById('video');

// Đường dẫn đến ảnh mẫu
const storedImageSrc = 'images/thuyid.jpg';

let storedImage = new Image();
storedImage.src = storedImageSrc;

let model;

async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    cameraElement.srcObject = stream;
    return new Promise((resolve) => {
        cameraElement.onloadedmetadata = () => {
            resolve();
        };
    });
}

async function setupModel() {
    model = await mobilenet.load(); // Tải mô hình MobileNet
}

async function detectFrame() {
    const canvas = document.createElement('canvas');
    canvas.width = cameraElement.videoWidth;
    canvas.height = cameraElement.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(cameraElement, 0, 0, canvas.width, canvas.height);

    const frameImage = new Image();
    frameImage.src = canvas.toDataURL();
    
    // Tải ảnh quét vào mô hình
    const predictions = await model.classify(canvas);

    console.log('Dự đoán từ mô hình: ', predictions);

    // So sánh dự đoán với ảnh mẫu
    const isMatch = await compareImages(storedImage, canvas);

    if (isMatch) {
        console.log('Ảnh quét khớp với ảnh mẫu.');
        cameraElement.style.display = 'none';
        videoElement.src = 'video/thuyvd.mp4'; // Đặt nguồn video tương ứng
        videoContainer.style.display = 'flex';
        videoElement.oncanplay = () => {
            videoElement.play().catch(error => {
                console.error("Không thể phát video: ", error);
            });
        };
    } else {
        console.log('Ảnh quét không khớp với ảnh mẫu.');
        requestAnimationFrame(detectFrame);
    }
}

async function compareImages(image, canvas) {
    return new Promise((resolve) => {
        const imageCanvas = document.createElement('canvas');
        imageCanvas.width = canvas.width;
        imageCanvas.height = canvas.height;
        const context = imageCanvas.getContext('2d');
        context.drawImage(canvas, 0, 0, canvas.width, canvas.height);

        // So sánh ảnh mẫu và ảnh quét (phương pháp đơn giản)
        const imgData1 = context.getImageData(0, 0, imageCanvas.width, imageCanvas.height).data;
        const imgData2 = context.getImageData(0, 0, canvas.width, canvas.height).data;

        let isMatch = false;
        let diffCount = 0;

        for (let i = 0; i < imgData1.length; i += 4) {
            const r1 = imgData1[i];
            const g1 = imgData1[i + 1];
            const b1 = imgData1[i + 2];
            const r2 = imgData2[i];
            const g2 = imgData2[i + 1];
            const b2 = imgData2[i + 2];

            const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);

            if (diff > 50) {
                diffCount++;
            }
        }

        // Xác định tỷ lệ sự khác biệt để cho phép ảnh khớp
        if (diffCount < (canvas.width * canvas.height * 0.01)) { // 1% là ngưỡng khác biệt cho phép
            isMatch = true;
        }
        
        resolve(isMatch);
    });
}

async function main() {
    await setupCamera();
    await setupModel();
    detectFrame();
}

main();
