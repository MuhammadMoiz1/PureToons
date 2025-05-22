# Puretoons: A Multi-Modal Framework for Detecting Inappropriate Content in Children's Cartoons

## Abstract

**Puretoons** proposes a novel **multi-modal content moderation framework** that integrates **Natural Language Processing (NLP)** and **Computer Vision (CV)** to detect inappropriate content in animated video media targeted at children. This system employs state-of-the-art deep learning architectures, enhanced with contrastive learning and refined through a progressive data augmentation and validation pipeline. The aim is to support safer digital experiences by ensuring context-aware, real-time detection of sensitive content.

---

## 1. Model Architecture

### 1.1 Natural Language Processing (NLP)

The following Transformer-based models were employed to analyze subtitles and dialogue transcripts:

- **BERT-Base**
- **RoBERTa**
- **DistilBERT**
- **Contrastive Learning-enhanced BERT-Base**

These models were trained for multi-class classification across five distinct labels: **Vulgar**, **LGBTQ+**, **Hate-speech**, **Mature**, and **Neutral**.

### 1.2 Computer Vision (CV)

Visual analysis was conducted using advanced object detection frameworks capable of localizing harmful elements within cartoon frames:

- **YOLOv11** (You Only Look Once)
- **RF-DETR** (Region-aware Feature DEtection TRansformer)
- **Faster R-CNN**

These models were trained on labeled visual data across categories including **Weapons**, **LGBTQ+ symbols**, **Nudity**, **Blood**, and **Kissing scenes**.

---

## 2. Data Collection and Annotation

### 2.1 NLP Data Collection Techniques

A multi-stage, hybrid approach was employed to construct a robust textual dataset:

1. **Manual Transcription and Labeling**:  
   - Dialogue excerpts were manually extracted from cartoon transcripts.
   - Each sample was annotated into one of the five predefined classes based on semantic context.

2. **Model-assisted Bootstrapping**:  
   - Initially trained NLP models were used to predict dialogue classes in unseen transcripts.
   - These predictions were manually validated and incorporated into the dataset, effectively expanding data volume and diversity.

3. **Generative Augmentation using AI**:  
   - Context-rich dialogue examples were synthesized using generative AI models (e.g., ChatGPT, MetaAI) to diversify training data and simulate edge-case semantics.

4. **Neutral vs. Hate-speech Disambiguation Pipeline**:  
   - An auxiliary pipeline was established to refine classification between **Hate-speech** and **Neutral** classes:
     - First, dialogues predicted as "Hate-speech" by the primary model were isolated.
     - These were passed through a **Sentiment Analysis** model.
     - Positively scored outputs were manually reviewed and, if appropriate, reclassified as "Neutral"—correcting for misclassifications driven by lexical ambiguity.

This hybrid and iterative approach significantly improved the contextual accuracy and balance of the NLP dataset.

### 2.2 CV Data Collection Techniques

Visual content data was generated and annotated as follows:

1. **Synthetic Generation using GenAI Tools**:  
   - Cartoon-style imagery reflecting inappropriate visual themes was generated using GenAI platforms.

2. **Class Definitions**:  
   - The dataset covered five categories of concern: **Weapons**, **LGBTQ+**, **Nudity**, **Blood**, and **Kiss scenes**.

3. **Annotation and Preprocessing**:  
   - Bounding box annotations were created using **Roboflow**.
   - Images were normalized and resized (e.g., 640×640) according to model requirements.

---

## 3. Model Training and Optimization

### NLP Models

- Fine-tuning of all Transformer models was conducted using cross-entropy loss and the **Adam optimizer** (`learning rate = 2e-5`).
- Epochs: **3**
- Evaluation Metrics: **Accuracy**, **F1 Score**

### CV Models

- Object detection models were trained for **100 epochs** (YOLOv11) with:
  - Batch size: **16**
  - Loss functions: Bounding Box Regression + Classification Loss
- Evaluation Metrics: **Precision**, **Recall**, **F1 Score**

---

## 4. Evaluation Results

### 4.1 NLP Model Performance

| Model                          | Accuracy |
|-------------------------------|----------|
| BERT-Base                     | 0.83     |
| RoBERTa                       | 0.84     |
| DistilBERT                    | 0.82     |
| **Contrastive + BERT-Base**   | **0.87** |

> The combination of **Contrastive Learning with BERT-Base** provided the highest accuracy by enhancing the model’s semantic differentiation capacity—minimizing both false positives and false negatives.

### 4.2 CV Model Performance

| Model        | Precision | Recall | F1 Score |
|--------------|-----------|--------|----------|
| YOLOv11      | 0.83      | **0.91** | 0.84     |
| RF-DETR      | **0.89**  | 0.86   | **0.86**  |
| Faster R-CNN | 0.60      | 0.87   | 0.70     |

> **YOLOv11** demonstrated superior recall, ideal for maximum coverage of inappropriate instances. **RF-DETR** offered the best precision, minimizing false alarms.

---

## 5. Multi-Modal Fusion Strategy

- NLP and CV modules process subtitles and video frames independently.
- Their respective outputs (text classification probabilities and object detection bounding boxes) are **fused at the decision level** using a late fusion architecture.
- This enables **contextual verification** across modalities, improving classification robustness and confidence scores.

---

## 6. Conclusion

The Puretoons system demonstrates that a **multi-modal, context-aware, and human-in-the-loop approach** to content filtering in children's media significantly enhances both accuracy and reliability. The use of Transformer models augmented with contrastive learning and iterative data refinement strategies resulted in superior classification performance. In parallel, CV models such as YOLOv11 provided efficient and precise detection of sensitive visuals in stylized media.

---

## 7. Future Directions

- **Audio Modality Integration** to capture tonal implications and off-screen cues.
- **Temporal Modeling** with 3D CNNs or Video Transformers to consider sequence continuity.
- **Cross-lingual and Cultural Dataset Expansion** for improved generalizability.
- **Edge Deployment Optimization** for real-time content moderation on mobile platforms.

---

## 🧑‍💻 Authors and Affiliation

**Muhammad Ibrahim Jawaid**, **Muhammad Kashaaf**, **Muhammad Moiz**  
Department of Computer Science, FAST NUCES  
Emails: `{k214933, k213380, k214508}@nu.edu.pk`  
Supervisor: **Prof. Shoaib Rauf**  
Co-supervisor: **Dr. M. Shahzad**

---

## 📌 Keywords

Transformer Models, BERT, YOLO, Contrastive Learning, GenAI, NLP, CV, Content Moderation, Child Safety, Multi-modal AI

