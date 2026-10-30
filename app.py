"""Streamlit interface for the trained SMS spam detection model."""

from pathlib import Path
from typing import Any

import joblib
import streamlit as st


PROJECT_DIR = Path(__file__).resolve().parent
MODEL_PATH = PROJECT_DIR / "models" / "spam_model.pkl"

st.set_page_config(
    page_title="Message Signal | Spam Detection",
    page_icon="✉️",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown(
    """
    <style>
    :root {
        --ink: #172b2a;
        --muted: #596b68;
        --paper: #f5f7f2;
        --green: #155e4b;
        --lime: #d4ef77;
        --coral: #c94e3b;
        --line: #dce5dd;
    }
    .stApp { background: var(--paper); color: var(--ink); }
    [data-testid="stHeader"] { background: transparent; }
    .block-container { max-width: 1120px; padding-top: 2rem; padding-bottom: 3rem; }
    h1, h2, h3, p, label { color: var(--ink); }
    h1 { font-family: Georgia, 'Times New Roman', serif; letter-spacing: 0; }
    .eyebrow { color: var(--green); font-size: .76rem; font-weight: 800;
        letter-spacing: .13em; text-transform: uppercase; }
    .lede { max-width: 660px; color: var(--muted); font-size: 1.08rem; line-height: 1.65; }
    .status { border-left: 5px solid var(--green); background: #e6f1e8;
        padding: 1rem 1.2rem; border-radius: 4px; margin-top: .7rem; }
    .status.spam { border-color: var(--coral); background: #fae9e4; }
    .status strong { display: block; font-size: 1.35rem; margin-bottom: .2rem; }
    .small-note { color: var(--muted); font-size: .88rem; line-height: 1.5; }
    div[data-testid="stTextArea"] textarea { border: 1px solid var(--line); border-radius: 5px; }
    div[data-testid="stButton"] button[kind="primary"] {
        background: var(--green); border: 0; color: white; border-radius: 4px;
        min-height: 2.8rem; font-weight: 700;
    }
    div[data-testid="stButton"] button[kind="primary"]:hover { background: #0e493a; }
    [data-testid="stSidebar"] { background: #e8eee7; border-right: 1px solid var(--line); }
    [data-testid="stMetric"] { background: white; padding: .8rem; border: 1px solid var(--line); border-radius: 4px; }
    @media (max-width: 640px) {
        .block-container { padding: 1.2rem 1rem 2rem; }
        h1 { font-size: 2.2rem; }
    }
    </style>
    """,
    unsafe_allow_html=True,
)


@st.cache_resource
def load_artifact(model_path: str) -> dict[str, Any] | None:
    """Load the artifact once per app session; return None for missing files."""
    path = Path(model_path)
    if not path.is_file():
        return None
    try:
        artifact = joblib.load(path)
    except Exception as error:
        st.error(f"The saved model could not be opened: {error}")
        return None

    if not isinstance(artifact, dict) or "pipeline" not in artifact:
        st.error("The model file has an unsupported format. Train the model again.")
        return None
    return artifact


def show_metrics(artifact: dict[str, Any]) -> None:
    """Show evaluation metrics stored during model training."""
    metrics = artifact.get("metrics", {})
    if not metrics:
        st.info("Evaluation metrics are not available in this model artifact.")
        return

    def show_metric_set(title: str, values: dict[str, Any]) -> None:
        st.markdown(f"**{title}**")
        columns = st.columns(4)
        for column, label, key in zip(
            columns,
            ("Accuracy", "Precision · spam", "Recall · spam", "F1 · spam"),
            ("accuracy", "precision", "recall", "f1_score"),
        ):
            value = values.get(key)
            column.metric(
                label,
                f"{value:.1%}" if isinstance(value, (float, int)) else "N/A",
            )
        matrix = values.get("confusion_matrix")
        if matrix:
            labels = values.get("confusion_matrix_labels", ["ham", "spam"])
            st.caption(
                f"Confusion matrix (actual rows, predicted columns; "
                f"{', '.join(labels)}): {matrix}"
            )

    st.caption("Scores use held-out examples from the uploaded datasets.")
    show_metric_set("Combined holdout", metrics)
    for source, source_metrics in artifact.get("source_metrics", {}).items():
        show_metric_set(f"{source.title()} holdout", source_metrics)


artifact = load_artifact(str(MODEL_PATH))
with st.sidebar:
    st.markdown("### Model notes")
    if artifact:
        st.write(artifact.get("model_name", "TF-IDF + Multinomial Naive Bayes"))
        for source, file_name in artifact.get("training_data", {}).items():
            count = artifact.get("training_samples", {}).get(source)
            count_note = f" ({count:,} cleaned rows)" if count else ""
            st.caption(f"{source.title()}: {file_name}{count_note}")
    else:
        st.warning("No trained model is available yet.")
        st.code("python train_model.py", language="bash")
    st.divider()
    st.markdown("**Scope**")
    st.write(
        "This model was trained and evaluated on the supplied labeled email and "
        "SMS datasets. Results describe only their held-out samples."
    )

st.markdown('<div class="eyebrow">Natural language processing · message screening</div>', unsafe_allow_html=True)
st.title("Email & SMS Spam Detection")
st.markdown(
    '<p class="lede">A TF-IDF and Multinomial Naive Bayes mini-project. '
    'Paste a message to see how the model classifies it.</p>',
    unsafe_allow_html=True,
)
st.divider()

left_column, right_column = st.columns([1.35, 0.85], gap="large")
with left_column:
    st.subheader("Check a message")
    with st.form("message_form"):
        message = st.text_area(
            "Message text",
            value=st.session_state.get("example_message", ""),
            height=190,
            placeholder="Paste an email or SMS message here...",
            label_visibility="collapsed",
        )
        submitted = st.form_submit_button("Check message", type="primary")

    if submitted:
        if not message.strip():
            st.warning("Enter a message before checking it.")
        elif artifact is None:
            st.error(
                "The trained model is missing or invalid. Download the dataset, "
                "then run `python train_model.py`."
            )
        else:
            pipeline = artifact["pipeline"]
            prediction = str(pipeline.predict([message])[0])
            spam_index = list(pipeline.classes_).index("spam")
            probability = float(pipeline.predict_proba([message])[0][spam_index])
            if prediction == "spam":
                st.markdown(
                    f'<div class="status spam"><strong>⚠ Spam</strong>'
                    f'Estimated spam probability: {probability:.1%}</div>',
                    unsafe_allow_html=True,
                )
            else:
                st.markdown(
                    f'<div class="status"><strong>✓ Not Spam (Ham)</strong>'
                    f'Estimated spam probability: {probability:.1%}</div>',
                    unsafe_allow_html=True,
                )
            st.caption(
                "This probability is the model's estimate, not a guarantee. "
                "Check suspicious messages carefully."
            )

with right_column:
    st.subheader("Try an example")
    examples = [
        ("Email spam", "Subject: Claim your prize now. Click here to receive your reward."),
        ("SMS spam", "WIN a free prize now! Call 09000000000 to claim your reward."),
        ("SMS ham", "Hi, are we still meeting for lunch at 12:30?"),
    ]
    for label, example in examples:
        if st.button(label, key=f"example_{label}", use_container_width=True):
            st.session_state["example_message"] = example
            st.rerun()
    st.markdown(
        '<p class="small-note">Examples are for interface testing; their output '
        'depends on the model trained from your dataset.</p>',
        unsafe_allow_html=True,
    )

st.divider()
st.subheader("Model evaluation")
if artifact:
    show_metrics(artifact)
    st.caption(
        "The spam probability is a model estimate, not a guarantee. "
        "Holdout results do not guarantee performance on future messages."
    )
else:
    st.info("Train the model to populate evaluation metrics here.")