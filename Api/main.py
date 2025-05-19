from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import numpy as np
import assemblyai as aai
import cv2
import os
import time
from ultralytics import YOLO


model = None
tokenizer = None

app = FastAPI()

app.mount(
    "/processed_frames",
    StaticFiles(directory="processed_frames"),
    name="processed_frames",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React app URL
    allow_methods=["PUT"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def load_model():
    global model, tokenizer, YOLO
    # Load the YOLO model
    print("Loading YOLO model...")
    YOLO = YOLO("best.pt")
    print("YOLO model loaded successfully!")
    print("Loading BERT model and tokenizer...")
    Video = None
    tokenizer = AutoTokenizer.from_pretrained("Puretoons-BertBase-7000-contrastive")
    model = AutoModelForSequenceClassification.from_pretrained(
        "Puretoons-BertBase-7000-contrastive", num_labels=5
    )
    print("Model and tokenizer loaded successfully!")


def detect_bounding_boxes(frame):

    # Perform inference on the frame
    results = YOLO.predict(source=frame, save=False, save_txt=False, conf=0.5)

    # Extract bounding boxes, class labels, and confidence scores
    bounding_boxes = []
    for result in results:
        for box in result.boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()  # Bounding box coordinates
            conf = box.conf[0].item()  # Confidence score
            cls = int(box.cls[0].item())  # Class label
            class_name = result.names[cls]  # Class name
            bounding_boxes.append(
                {"bbox": [x1, y1, x2, y2], "confidence": conf, "class": class_name}
            )

    return bounding_boxes


def video_to_frames(filename, video_path, output_folder="frames", target_fps=10):
    """
    Extracts frames from a video at the specified FPS and saves them to the specified folder.

    Args:
        filename (str): Base name for the frames.
        video_path (str): Path to the video file.
        output_folder (str): Directory to save the frames.
        target_fps (int): The desired FPS for frame extraction.

    Returns:
        list: A list of paths to the saved frames.
    """
    timeStamp = int(time.time())
    videoInfo = []
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    # Open the video file
    video_capture = cv2.VideoCapture(video_path)
    if not video_capture.isOpened():
        raise ValueError(f"Unable to open video file: {video_path}")

    # Get the original FPS of the video
    original_fps = video_capture.get(cv2.CAP_PROP_FPS)
    frame_interval = int(original_fps / target_fps)  # Calculate the frame interval

    frame_count = 0
    success, frame = video_capture.read()

    # Loop through the video and save frames at the target FPS
    while success:
        if frame_count % frame_interval == 0:  # Save only every 'frame_interval' frame
            frame_filename = os.path.join(
                output_folder, f"{filename}_{timeStamp}_frame_{frame_count:04d}.jpg"
            )
            cv2.imwrite(frame_filename, frame)  # Save the frame as a JPEG file
            videoInfo.append(frame_filename)

        frame_count += 1
        success, frame = video_capture.read()

    video_capture.release()
    print(f"Extracted {len(videoInfo)} frames to {output_folder} at {target_fps} FPS")
    return videoInfo


def extract_transcript(audio_path):
    aai.settings.api_key = "f7f187e1dc984b7b9379fcd4784614d1"
    audio_file = audio_path
    transcriber = aai.Transcriber()
    config = aai.TranscriptionConfig(speaker_labels=True)
    transcript = transcriber.transcribe(audio_file, config)
    if transcript.status == aai.TranscriptStatus.error:
        print(f"Transcription failed: {transcript.error}")
        return "error Transcribing"

    text = [utterance.text for utterance in transcript.utterances]

    return text


def predict(texts):
    all_predictions = []

    # Process texts in batches
    for i in range(0, len(texts), 16):
        batch_texts = texts[i : i + 16]

        # Tokenize
        encodings = tokenizer(
            batch_texts,
            truncation=True,
            padding=True,
            max_length=512,
            return_tensors="pt",
        )

        # Move to device
        input_ids = encodings["input_ids"]
        attention_mask = encodings["attention_mask"]

        # Get predictions
        with torch.no_grad():
            outputs = model(input_ids, attention_mask=attention_mask)
            predictions = torch.softmax(outputs.logits, dim=1)
            predictions = predictions.cpu().numpy()
            all_predictions.extend(predictions)

    return np.array(all_predictions)


@app.put("/upload-video/")
async def upload_video(file: UploadFile = File(...)):
    global Video
    try:
        Video = file
        # Save the uploaded video file to a directory
        with open(f"uploaded_videos/{file.filename}", "wb") as video_file:
            content = await file.read()  # Read the video file content
            video_file.write(content)  # Write the content to a file
        transcript = extract_transcript(f"uploaded_videos/{file.filename}")
        separated_list = []

        for i in range(len(transcript) - 1):
            separated_list.append(f"{transcript[i]}[SEP]{transcript[i + 1]}")

        if len(transcript) < 2:
            separated_list = transcript

        predictions = predict(separated_list)

        predicted_classes = predictions.argmax(axis=1)
        print(predicted_classes)
        result = {}  # Dictionary

        for i, (text, pred_class) in enumerate(zip(separated_list, predicted_classes)):
            result[i] = {"text": text, "label": int(pred_class)}
        # Save the frames

        print(result)
        return result
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.get("/get_visual_analysis/")
async def get_visual_analysis():
    try:
        # Extract frames from the video
        videoInfo = video_to_frames(Video.filename, f"uploaded_videos/{Video.filename}")

        # Create a folder for processed frames
        processed_folder = "processed_frames"
        if not os.path.exists(processed_folder):
            os.makedirs(processed_folder)

        processed_frame_paths = []  # List to store paths of processed frames
        classFreq = {}
        for frameURL in videoInfo:
            frame = cv2.imread(frameURL)  # Read the frame
            bounding_boxes = detect_bounding_boxes(frame)  # Detect bounding boxes

            # Draw bounding boxes on the frame
            for box in bounding_boxes:
                x1, y1, x2, y2 = box["bbox"]
                cv2.rectangle(
                    frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2
                )
                cv2.putText(
                    frame,
                    f"Class: {box['class']}, Conf: {box['confidence']:.2f}",
                    (int(x1), int(y1) - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (0, 255, 0),
                    2,
                )
                # Count the frequency of each class
                if box["class"] in classFreq:
                    classFreq[box["class"]] += 1
                else:
                    classFreq[box["class"]] = 1
            # Save the processed frame to the new folder
            processed_frame_path = os.path.join(
                processed_folder, os.path.basename(frameURL)
            )
            cv2.imwrite(processed_frame_path, frame)
            if len(bounding_boxes) > 0:

                processed_frame_paths.append(
                    {
                        "path": processed_frame_path,
                    }
                )

        return {"processed_frames": processed_frame_paths, "class_frequency": classFreq}

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
