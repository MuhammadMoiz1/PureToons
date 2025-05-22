# Puretoons: A Multi-Modal Framework for Detecting Inappropriate Content in Children's Cartoons

## Abstract

**Puretoons** introduces an AI-driven, **multi-modal architecture** that leverages both **Natural Language Processing (NLP)** and **Computer Vision (CV)** to detect inappropriate content in cartoon videos targeted at children. By combining Transformer-based textual analysis and advanced object detection models trained on stylized cartoon imagery, the system provides a robust, context-aware content moderation solution. Through rigorous data collection, model optimization, and late-fusion decision strategies, this framework offers an academically rigorous approach to safeguarding children's digital media consumption.

---

## 1. Model Architecture

### 1.1 Natural Language Processing (NLP)

Transformer models employed for subtitle/dialogue classification:
- **BERT-Base**
- **RoBERTa**
- **DistilBERT**
- **Contrastive Learning + BERT-Base**

All models were trained on multi-class labels: **Vulgar**, **LGBTQ+**, **Hate-speech**, **Mature**, and **Neutral**.

### 1.2 Computer Vision (CV)

Object detection models for analyzing cartoon video frames:
- **YOLOv11**
- **RF-DETR**
- **Faster R-CNN**

These models were trained on annotated **cartoon-style images**, specifically stylized to reflect realistic animation environments.

---

## 2. Data Collection and Annotation

### 2.1 NLP Data Collection Techniques & Their Advantages

| Technique | Description | Advantages |
|----------|-------------|------------|
| **Manual Dialogue Extraction** | Transcripts of cartoon videos were manually parsed and annotated. | Ensures accurate semantic labeling and human interpretation of nuance. |
| **Model-assisted Label Expansion** | Preliminary models were used to predict classes on unlabelled data; outputs were manually verified. | Scales dataset efficiently while retaining quality through human oversight. |
| **AI-Generated Dialogues** | Generated contextually rich samples using GenAI tools (e.g., ChatGPT, MetaAI). | Fills rare edge cases, boosts data diversity, and enhances contextual robustness. |
| **Hate-Speech vs. Neutral Resolution Pipeline** | Pipeline detected potential hate speech, analyzed sentiment, and reclassified false positives as Neutral after manual review. | Significantly reduced semantic confusion and false positives between ambiguous classes. |

> 💡 *Advantage Summary*: This iterative, hybrid collection strategy ensured **contextual richness**, **scalability**, and **semantic precision**, which are critical in detecting subtle or masked forms of inappropriate language.

---

### 2.2 CV Data Collection Techniques & Their Advantages

| Technique | Description | Advantages |
|----------|-------------|------------|
| **Synthetic Cartoon Image Generation** | Stylized cartoon visuals were created using generative AI tools. | Controls content diversity and enables coverage of otherwise rare or sensitive visual cases. |
| **Cartoon-style Domain-Specific Data** | Training data explicitly focused on **cartoon-style imagery**, not real-life objects or scenes. | Increases **domain relevance**, improves **generalization** to stylized animation, and ensures higher **real-world applicability** to YouTube Kids-like content. |
| **Bounding Box Annotation (via Roboflow)** | Manual bounding box creation for object detection classes: Weapons, LGBTQ+, Nudity, Blood, Kiss. | Ensures consistent, high-quality spatial labeling for supervised detection models. |

> 🎨 *Why Cartoon Data?*  
Conventional object detectors often fail when applied to **animated or stylized content** due to texture, proportion, and shape deviations. By training directly on **cartoon data**, the system achieves better accuracy, reduces domain shift, and avoids overfitting to realistic datasets ill-suited for animated media.

---

## 4. Evaluation Results

### 4.1 NLP Model Performance

| Model                          | Accuracy |
|-------------------------------|----------|
| BERT-Base                     | 0.83     |
| RoBERTa                       | 0.84     |
| DistilBERT                    | 0.82     |
| **Contrastive + BERT-Base**   | **0.87** |

> Contrastive learning significantly improved the model's ability to disambiguate subtle, context-dependent language—key in distinguishing benign vs. harmful intent.

### 4.2 CV Model Performance

| Model        | Precision | Recall | F1 Score |
|--------------|-----------|--------|----------|
| YOLOv11      | 0.83      | **0.91** | 0.84     |
| RF-DETR      | **0.89**  | 0.86   | **0.86**  |
| Faster R-CNN | 0.60      | 0.87   | 0.70     |

> YOLOv11 yielded the highest recall, ideal for capturing most instances of inappropriate visuals. RF-DETR offered superior precision, minimizing false positives—a valuable trait for sensitive content moderation.

---

## 5. Multi-Modal Fusion Strategy

- NLP and CV subsystems operate independently on subtitles and visual frames.
- Results are fused at the **decision layer**, allowing mutual validation and improved **classification confidence**.
- Enables robust detection even when one modality presents weak or ambiguous signals.

---

## 6. Conclusion

**Puretoons** demonstrates that the integration of NLP and CV through a **multi-modal architecture**, combined with thoughtful dataset design and iterative validation, can substantially improve inappropriate content detection in stylized media. By focusing on both **contextual language cues** and **cartoon-specific visuals**, this system significantly outperforms traditional, metadata-based or mono-modal moderation techniques.

---

## 🧑‍💻 Authors and Affiliation

**Muhammad Ibrahim Jawaid**, **Muhammad Kashaaf**, **Muhammad Moiz**  
Department of Computer Science, FAST NUCES  
Emails: `{k214933, k213380, k214508}@nu.edu.pk`  
Supervisor: **Prof. Shoaib Rauf**  
Co-supervisor: **Dr. M. Shahzad**

---

## 📌 Keywords

NLP, Computer Vision, Content Moderation, YOLO, BERT, Contrastive Learning, Cartoon Data, Stylized Object Detection, Child Safety, Multi-modal AI, Deep Learning

