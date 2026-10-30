"""Train and evaluate a combined email and SMS spam detection pipeline."""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline


def load_dataset(dataset_path: Path, source: str) -> pd.DataFrame:
    """Read one email or SMS CSV and normalize its labels and columns."""
    if not dataset_path.exists():
        raise FileNotFoundError(
            f"{source.title()} dataset not found: {dataset_path}. "
            "Check the path or pass it with the matching command-line option."
        )

    try:
        data = pd.read_csv(dataset_path, encoding="latin-1")
    except (pd.errors.ParserError, UnicodeDecodeError, OSError) as error:
        raise ValueError(f"Could not read the dataset CSV: {error}") from error

    columns = {str(column).strip().lower(): column for column in data.columns}
    column_pairs = (
        (("v1", "v2"), ("label", "message"), ("spam", "text"), ("label", "text"))
        if source == "email"
        else (("v1", "v2"), ("label", "message"), ("spam", "text"), ("label", "text"))
    )
    selected_columns = next(
        ((columns[label], columns[message]) for label, message in column_pairs
         if label in columns and message in columns),
        None,
    )
    if selected_columns is None:
        expected = "text and spam/label" if source == "email" else "label and message (or v1 and v2)"
        raise ValueError(
            f"Invalid {source} CSV format. Expected columns for {expected}; "
            f"found: {list(data.columns)}."
        )

    label_column, message_column = selected_columns
    data = data[[label_column, message_column]].rename(
        columns={label_column: "label", message_column: "message"}
    )
    data = data.dropna(subset=["label", "message"]).copy()
    label_map = {
        "ham": "ham",
        "not spam": "ham",
        "not_spam": "ham",
        "not-spam": "ham",
        "legitimate": "ham",
        "legit": "ham",
        "0": "ham",
        "false": "ham",
        "spam": "spam",
        "1": "spam",
        "true": "spam",
    }
    data["label"] = data["label"].astype(str).str.strip().str.lower().map(label_map)
    data["message"] = data["message"].astype(str).str.strip()
    data = data.dropna(subset=["label"])
    data = data[data["message"].ne("")].drop_duplicates(
        subset=["label", "message"]
    )

    if data.empty:
        raise ValueError("No usable records remain after cleaning the dataset.")

    class_counts = data["label"].value_counts()
    if set(class_counts.index) != {"ham", "spam"} or class_counts.min() < 5:
        raise ValueError(
            f"The cleaned {source} dataset must contain at least five records for "
            "each label: 'ham' and 'spam', so it can be split for evaluation."
        )

    data["source"] = source
    return data


def build_pipeline() -> Pipeline:
    """Create one shared text-to-prediction pipeline for training and the app."""
    return Pipeline(
        steps=[
            ("tfidf", TfidfVectorizer(min_df=2, max_features=50_000)),
            ("classifier", MultinomialNB()),
        ]
    )


def calculate_metrics(labels: pd.Series, predictions: Any) -> dict[str, Any]:
    """Calculate binary classification metrics with spam as the positive class."""
    label_order = ["ham", "spam"]
    return {
        "accuracy": float(accuracy_score(labels, predictions)),
        "precision": float(precision_score(labels, predictions, pos_label="spam", zero_division=0)),
        "recall": float(recall_score(labels, predictions, pos_label="spam", zero_division=0)),
        "f1_score": float(f1_score(labels, predictions, pos_label="spam", zero_division=0)),
        "confusion_matrix": confusion_matrix(labels, predictions, labels=label_order).tolist(),
        "confusion_matrix_labels": label_order,
        "test_samples": int(len(labels)),
    }


def train_and_evaluate(
    email_path: Path, sms_path: Path, model_path: Path
) -> dict[str, Any]:
    """Train from both sources and evaluate each on its own stratified holdout."""
    datasets = {
        "email": load_dataset(email_path, "email"),
        "sms": load_dataset(sms_path, "sms"),
    }
    training_parts = []
    test_parts = []
    for source, data in datasets.items():
        features_train, features_test, labels_train, labels_test = train_test_split(
            data["message"],
            data["label"],
            test_size=0.2,
            random_state=42,
            stratify=data["label"],
        )
        training_parts.append(
            pd.DataFrame({"message": features_train, "label": labels_train, "source": source})
        )
        test_parts.append(
            pd.DataFrame({"message": features_test, "label": labels_test, "source": source})
        )

    training_data = pd.concat(training_parts, ignore_index=True)
    test_data = pd.concat(test_parts, ignore_index=True)

    pipeline = build_pipeline()
    pipeline.fit(training_data["message"], training_data["label"])
    predictions = pipeline.predict(test_data["message"])
    metrics = calculate_metrics(test_data["label"], predictions)
    source_metrics = {
        source: calculate_metrics(
            test_data.loc[test_data["source"] == source, "label"],
            predictions[test_data["source"].eq(source).to_numpy()],
        )
        for source in datasets
    }
    artifact = {
        "pipeline": pipeline,
        "metrics": metrics,
        "source_metrics": source_metrics,
        "model_name": "Multinomial Naive Bayes with TF-IDF",
        "training_data": {source: path.name for source, path in {
            "email": email_path, "sms": sms_path
        }.items()},
        "training_samples": {
            source: int(len(data)) for source, data in datasets.items()
        },
        "evaluation_note": (
            "Overall and per-source metrics are measured on separate stratified "
            "20% holdouts from the supplied email and SMS datasets."
        ),
    }

    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, model_path)
    return {**metrics, "source_metrics": source_metrics}


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Train and evaluate the email and SMS spam detection model."
    )
    parser.add_argument(
        "--email-data",
        type=Path,
        default=Path(__file__).resolve().parent / "emails.csv" / "emails.csv",
        help="Email CSV with text and spam/label columns.",
    )
    parser.add_argument(
        "--sms-data",
        type=Path,
        default=Path(__file__).resolve().parent / "sms.csv" / "sms_spam_collection .csv",
        help="SMS CSV with label/message or Kaggle v1/v2 columns.",
    )
    parser.add_argument(
        "--model",
        type=Path,
        default=Path(__file__).resolve().parent / "models" / "spam_model.pkl",
        help="Where to save the trained model artifact.",
    )
    arguments = parser.parse_args()

    try:
        metrics = train_and_evaluate(
            arguments.email_data, arguments.sms_data, arguments.model
        )
    except (FileNotFoundError, ValueError) as error:
        parser.error(str(error))

    for source, source_metrics in [("Combined", metrics), *metrics.get("source_metrics", {}).items()]:
        print(f"\n{source.title()} evaluation on the 20% holdout")
        print(f"Accuracy:  {source_metrics['accuracy']:.4f}")
        print(f"Precision: {source_metrics['precision']:.4f} (spam class)")
        print(f"Recall:    {source_metrics['recall']:.4f} (spam class)")
        print(f"F1-score:  {source_metrics['f1_score']:.4f} (spam class)")
        print("Confusion matrix (rows = actual, columns = predicted; ham, spam):")
        for row in source_metrics["confusion_matrix"]:
            print(f"  {row}")
    print(f"\nSaved model to: {arguments.model.resolve()}")


if __name__ == "__main__":
    main()