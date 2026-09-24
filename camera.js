let stream = null;
let currentCamera = "user";

const openCamera = document.getElementById("openCamera");
const cameraBox = document.getElementById("cameraBox");
const video = document.getElementById("video");

const capture = document.getElementById("capture");
const switchCamera = document.getElementById("switchCamera");
const stopCamera = document.getElementById("stopCamera");

const canvas = document.getElementById("canvas");
const result = document.getElementById("result");
const photo = document.getElementById("photo");

const retake = document.getElementById("retake");
const download = document.getElementById("download");


// ===============================
// OPEN CAMERA
// ===============================

openCamera.addEventListener("click", async () => {

    result.style.display = "none";

    await startCamera(currentCamera);

    if (stream) {

        cameraBox.style.display = "block";

        cameraBox.scrollIntoView({
            behavior: "smooth"
        });
    }
});


// ===============================
// START CAMERA
// ===============================

async function startCamera(camera) {

    stopCameraStream();

    try {

        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: {
                    exact: camera
                }
            },
            audio: false
        });

    } catch (error) {

        console.log("Exact camera request failed:", error);

        try {

            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: camera
                },
                audio: false
            });

        } catch (error2) {

            console.log("Normal camera request failed:", error2);

            try {

                const devices =
                    await navigator.mediaDevices.enumerateDevices();

                const cameras = devices.filter(
                    device => device.kind === "videoinput"
                );

                if (cameras.length === 0) {
                    throw new Error("No camera found");
                }

                let selectedCamera = null;

                if (camera === "environment") {

                    selectedCamera = cameras.find(device =>
                        /back|rear|environment|main/i.test(
                            device.label
                        )
                    );

                    if (!selectedCamera && cameras.length > 1) {
                        selectedCamera = cameras[cameras.length - 1];
                    }

                } else {

                    selectedCamera = cameras.find(device =>
                        /front|user|facetime/i.test(
                            device.label
                        )
                    );

                    if (!selectedCamera) {
                        selectedCamera = cameras[0];
                    }
                }

                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        deviceId: {
                            exact: selectedCamera.deviceId
                        }
                    },
                    audio: false
                });

            } catch (finalError) {

                console.log("Camera error:", finalError);

                stream = null;

                alert(
                    "Camera could not be opened.\n\n" +
                    "Please check camera permission."
                );

                return;
            }
        }
    }

    video.srcObject = stream;

    if (camera === "user") {
        video.style.transform = "scaleX(-1)";
    } else {
        video.style.transform = "scaleX(1)";
    }
}


// ===============================
// SWITCH CAMERA
// ===============================

switchCamera.addEventListener("click", async () => {

    if (!stream) {
        return;
    }

    currentCamera =
        currentCamera === "user"
            ? "environment"
            : "user";

    await startCamera(currentCamera);
});


// ===============================
// CAPTURE PHOTO
// ===============================

capture.addEventListener("click", () => {

    if (!stream) {
        return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (currentCamera === "user") {

        context.translate(canvas.width, 0);
        context.scale(-1, 1);
    }

    context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );

    photo.src = canvas.toDataURL(
        "image/jpeg",
        0.92
    );

    // Camera OFF immediately after capture
    stopCameraStream();

    cameraBox.style.display = "none";

    result.style.display = "block";

    result.scrollIntoView({
        behavior: "smooth"
    });
});


// ===============================
// CLOSE CAMERA
// ===============================

stopCamera.addEventListener("click", () => {

    stopCameraStream();

    cameraBox.style.display = "none";
});


// ===============================
// RETAKE PHOTO
// ===============================

retake.addEventListener("click", async () => {

    result.style.display = "none";

    await startCamera(currentCamera);

    if (stream) {

        cameraBox.style.display = "block";

        cameraBox.scrollIntoView({
            behavior: "smooth"
        });
    }
});


// ===============================
// SAVE PHOTO
// ===============================

download.addEventListener("click", async () => {

    if (!photo.src) {

        alert("Pehle photo capture karo.");

        return;
    }

    try {

        const response = await fetch(photo.src);

        const blob = await response.blob();

        const file = new File(
            [blob],
            "VisionCam-photo.jpg",
            {
                type: "image/jpeg"
            }
        );

        // Mobile Share / Save
        if (
            navigator.canShare &&
            navigator.canShare({
                files: [file]
            })
        ) {

            await navigator.share({
                files: [file],
                title: "VisionCam Photo",
                text: "Captured with VisionCam"
            });

            return;
        }

        // Normal download fallback
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;
        link.download = "VisionCam-photo.jpg";

        document.body.appendChild(link);

        link.click();

        link.remove();

        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1500);

    } catch (error) {

        console.log("Save error:", error);

        alert(
            "Photo save nahi ho payi.\n\n" +
            "Please try again."
        );
    }
});


// ===============================
// STOP CAMERA STREAM
// ===============================

function stopCameraStream() {

    if (stream) {

        stream.getTracks().forEach(track => {
            track.stop();
        });

        stream = null;
    }

    video.srcObject = null;
}


// ===============================
// PAGE CLOSE
// ===============================

window.addEventListener("beforeunload", () => {

    stopCameraStream();

});