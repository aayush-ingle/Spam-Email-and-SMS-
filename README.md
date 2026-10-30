# SpamShield AI: Email and SMS Spam Detection

## Abstract

This mini-project trains a text classifier that labels email and SMS messages
as **spam** or **ham (not spam)**. It combines the supplied labeled email and
SMS CSVs, uses TF-IDF to represent message text numerically, and applies
Multinomial Naive Bayes. A React application accepts a message through a FastAPI
service and displays a prediction with an estimated spam probability.
Evaluation scores are calculated from separate held-out portions of the
supplied datasets.

## Problem Statement

Unwanted messages can waste time and expose people to scams. A lightweight text
classifier can help flag suspicious messages, but it must be evaluated on
appropriate labeled data and should not be treated as a substitute for careful
judgment.

## Objectives

- Clean a labeled CSV by removing missing, duplicate, and unsupported records.
- Convert message text to TF-IDF features and train a Multinomial Naive Bayes model.
- Evaluate with accuracy, spam precision, spam recall, F1-score, and a confusion matrix.
- Save the complete preprocessing and classification pipeline with Joblib.
- Demonstrate predictions in a responsive React interface backed by FastAPI.

## Existing and Proposed Systems

**Existing system:** Messages may be checked manually or filtered by fixed rules.
Such rules can miss new wording and require ongoing maintenance.

**Proposed system:** A supervised machine-learning model learns patterns from
the labeled email and SMS examples, then applies the same TF-IDF preprocessing
and classifier to new messages. It is an educational demonstration, not a
production mail filter.

## Software and Hardware Requirements

- Windows, macOS, or Linux; VS Code is recommended.
- Python 3.10 or newer.
- Internet access to obtain the dataset and install packages.
- At least 2 GB of available memory is sufficient for this small dataset.

## Project Structure

```text
spam_detection_nlp/
|-- api.py                   # FastAPI health, prediction, and metrics endpoints
|-- app.py                   # Original Streamlit interface, retained
|-- train_model.py
|-- requirements.txt
|-- README.md
|-- frontend/                # React + Vite + Tailwind client
|   |-- src/
|   `-- package.json
|-- emails.csv/
|   `-- emails.csv           # Uploaded email data (text, spam)
|-- sms.csv/
|   `-- sms_spam_collection .csv  # Uploaded SMS data (label, message)
`-- models/
    `-- spam_model.pkl       # Created after training
```

The uploaded datasets are used directly from these paths. Training creates
`models/spam_model.pkl` from those real files; the model is regenerated whenever
you run the training command.

## Dataset Setup

The project currently uses the two CSV files you uploaded:

- Email: `emails.csv/emails.csv`, with `text` and `spam` columns. Labels `1`
  and `0` are normalized to spam and ham.
- SMS: `sms.csv/sms_spam_collection .csv`, with `label` and `message` columns.
  Labels `spam` and `ham` are preserved.

The trainer also accepts common alternatives: email `text` plus `label`, SMS
`v1` plus `v2`, or `label` plus `message`. Missing values, unsupported labels,
empty messages, and duplicate label/message pairs are removed. Each source must
contain at least five cleaned examples per class for the stratified holdout.

The app has been trained and evaluated on both supplied datasets, but email
results apply only to the held-out rows from this email CSV. They do not prove
performance on other organizations, future email, or other email datasets. The
probability shown by the app is the model's estimate, not a guarantee or a
calibrated measure of real-world risk.

## System Architecture and Workflow

```text
Email CSV ----\
              -> validation and cleaning -> separate 80:20 holdouts
SMS CSV ------/ -> shared TF-IDF + Naive Bayes -> metrics by source
               -> Joblib artifact -> FastAPI -> React scanner -> prediction
```

Training and inference use one scikit-learn `Pipeline`, so both apply the same
vectorizer and learned vocabulary. Each dataset gets its own stratified 80:20
split before the training portions are combined. This preserves examples from
both sources in evaluation and reports email and SMS scores separately. A fixed
random seed makes the split reproducible for the same inputs and package behavior.

## NLP Techniques

**Text preprocessing:** The CSV is checked for the expected columns. Missing
labels/messages, empty messages, exact duplicate label/message pairs, and
unsupported labels are removed. `TfidfVectorizer` then tokenizes the text,
converts terms to lowercase, and weights terms using term frequency-inverse
document frequency. To keep the saved model manageable, terms appearing in
fewer than two training messages are excluded and at most 50,000 features are
kept. No separate stemming or stop-word removal is applied.

**TF-IDF:** Frequent terms in one message receive weight, while terms common
across many messages receive less weight. This creates numeric features for the
classifier without needing manually designed rules.

## Machine Learning Algorithm

Multinomial Naive Bayes is a supervised probabilistic classifier that estimates
the likelihood of word features for each class. It is fast and is a common
baseline for sparse text features. The model predicts `ham` or `spam`; its
`predict_proba` output is presented as an estimated spam probability, not a
guaranteed outcome.

## Installation and Execution

Open a terminal in this project folder. In PowerShell, run:

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

If PowerShell blocks activation, use the VS Code terminal configured for the
virtual environment, or run the interpreter directly as
`.\.venv\Scripts\python.exe -m pip install -r requirements.txt`.

The uploaded datasets are already at the default paths described above. To
retrain and evaluate:

```powershell
python train_model.py
```

The command reads both uploaded CSVs, prints combined and per-source metrics on
their 20% holdouts, and saves the model to `models/spam_model.pkl`. Optional
alternate paths are supported:

```powershell
python train_model.py --email-data path\to\emails.csv --sms-data path\to\sms.csv --model models\spam_model.pkl
```

### Start the FastAPI backend

```powershell
python -m uvicorn api:app --host 127.0.0.1 --port 8000
```

The API uses `models/spam_model.pkl` and exposes `/api/health`, `/api/predict`,
and `/api/metrics`. Interactive API docs are at `http://127.0.0.1:8000/docs`.
The backend reports an unavailable-model state if the artifact is missing.

### Start the React frontend

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. Set `VITE_API_URL` in `frontend/.env` to change
the API base (default: `http://127.0.0.1:8000/api`). Set `FRONTEND_ORIGINS` on
the backend if the frontend uses a different origin. `npm run build` creates a
production build in `frontend/dist`.

The original Streamlit app remains available as an alternative:

```powershell
python -m streamlit run app.py
```

## Testing Procedure

1. Confirm the email CSV has `text` and `spam` columns and the SMS CSV has `label` and `message` columns.
2. Run `python train_model.py`; verify combined, email, and SMS scores and confusion matrices are printed.
3. Start Uvicorn and confirm `/api/health` reports `model_ready: true`.
4. Start Vite and analyze the supplied examples; the scanner must use `/api/predict`.
5. Confirm the Performance view displays values from `/api/metrics`.
6. Verify history contains only short previews and clears only after confirmation.
7. Submit empty input and confirm analysis is disabled.
8. Stop the backend and confirm the frontend shows an error instead of a fabricated result.
9. Check that the displayed probability is described as an estimate, not a guarantee.

The printed results are the results for the local dataset and split. Do not
copy expected numbers from another run or report them as general performance.

## Results and Limitations

Training reports accuracy, precision, recall, and F1-score for the spam class,
plus confusion matrices whose rows are actual labels and columns are predicted
labels (`ham`, then `spam`). On the uploaded files and fixed split, the current
run produced combined accuracy **92.26%**, precision **99.58%**, recall
**58.46%**, and F1-score **73.67%**. Email holdout recall was **53.28%** and SMS
holdout recall was **69.53%**. These are reproducible results for the current
files, not guaranteed performance; retraining or changing the inputs can change
them. The low recall means many spam messages in the holdout were missed, despite
high precision and accuracy. Results depend on the dataset, label quality, and
held-out examples. The model may not reflect current spam or generalize to other
organizations, future messages, or other languages. Probability estimates may
be poorly calibrated. Do not use this model as the sole basis for security or
financial decisions.

## Future Enhancements

- Add diverse, appropriately licensed labeled email data and evaluate on an
  external email test set.
- Compare additional classifiers and validation strategies.
- Add calibration analysis, per-class metrics, and a confusion-matrix chart.
- Add model versioning, user feedback, and monitoring for changing message patterns.
- Improve language support and analyze links or sender metadata where lawful.

## Conclusion

This project demonstrates a complete introductory NLP workflow: data cleaning,
TF-IDF feature extraction, Naive Bayes training, holdout evaluation, model
serialization, a FastAPI service, and a responsive React interface. It uses
both uploaded email and SMS data, while keeping the evaluation and limitations
of each source visible.