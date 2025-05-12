from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import numpy as np
import assemblyai as aai

model=None
tokenizer=None

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React app URL
    allow_methods=["PUT"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def load_model():
    global model, tokenizer
    print("Loading BERT model and tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained("Puretoons-BertBase-6000")
    model = AutoModelForSequenceClassification.from_pretrained("Puretoons-BertBase-6000", num_labels=5)
    print("Model and tokenizer loaded successfully!")



def extract_transcript(audio_path):
    aai.settings.api_key = "f7f187e1dc984b7b9379fcd4784614d1"
    audio_file = audio_path
    transcriber = aai.Transcriber()
    config = aai.TranscriptionConfig(speaker_labels=True)
    transcript = transcriber.transcribe(audio_file, config)
    if transcript.status == aai.TranscriptStatus.error:
        print(f"Transcription failed: {transcript.error}")
        return 'error Transcribing'
    
    text=[utterance.text for utterance in transcript.utterances]

    
    return text

def predict(texts):
    all_predictions = []

        # Process texts in batches
    for i in range(0, len(texts), 16):
        batch_texts = texts[i:i + 16]

            # Tokenize
        encodings = tokenizer(
            batch_texts,
            truncation=True,
            padding=True,
            max_length=512,
            return_tensors="pt"
        )

            # Move to device
        input_ids = encodings['input_ids']
        attention_mask = encodings['attention_mask']

            # Get predictions
        with torch.no_grad():
            outputs = model(input_ids, attention_mask=attention_mask)
            predictions = torch.softmax(outputs.logits, dim=1)
            predictions = predictions.cpu().numpy()
            all_predictions.extend(predictions)
        
    return np.array(all_predictions)

@app.put("/upload-video/")
async def upload_video(file: UploadFile = File(...)):
    try:
        # Save the uploaded video file to a directory
        with open(f"uploaded_videos/{file.filename}", "wb") as video_file:
            content = await file.read()  # Read the video file content
            video_file.write(content)  # Write the content to a file
        
        transcript=extract_transcript(f"uploaded_videos/{file.filename}")
        separated_list = []
        

        for i in range(len(transcript) - 1):  
         separated_list.append(f"{transcript[i]}[SEP]{transcript[i + 1]}")

        if len(transcript)<2:
            separated_list=transcript

        predictions = predict(separated_list)
        
        predicted_classes = predictions.argmax(axis=1)
        print(predicted_classes)
        result = {}  # Dictionary

        for i, (text, pred_class) in enumerate(zip(separated_list, predicted_classes)):
           result[i] = {"text": text, "label": int(pred_class)}

        print(result)
        return result
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
