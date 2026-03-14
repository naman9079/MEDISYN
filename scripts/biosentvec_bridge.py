import argparse
import json
import sys
from dataclasses import dataclass
from typing import Any

import numpy as np


def ensure_nltk() -> None:
    import nltk

    try:
        nltk.data.find("tokenizers/punkt")
    except LookupError:
        nltk.download("punkt", quiet=True)

    try:
        nltk.data.find("corpora/stopwords")
    except LookupError:
        nltk.download("stopwords", quiet=True)


ensure_nltk()

import sent2vec  # noqa: E402
from nltk import word_tokenize  # noqa: E402
from nltk.corpus import stopwords  # noqa: E402
from scipy.spatial import distance  # noqa: E402
from string import punctuation  # noqa: E402


STOP_WORDS = set(stopwords.words("english"))


@dataclass
class Candidate:
    id: str
    text: str


def preprocess_sentence(text: str) -> str:
    text = text.replace("/", " / ")
    text = text.replace(".-", " .- ")
    text = text.replace(".", " . ")
    text = text.replace("'", " ' ")
    text = text.lower()
    tokens = [
        token
        for token in word_tokenize(text)
        if token not in punctuation and token not in STOP_WORDS
    ]
    return " ".join(tokens)


def cosine_similarity(left: np.ndarray, right: np.ndarray) -> float:
    if np.count_nonzero(left) == 0 or np.count_nonzero(right) == 0:
        return 0.0
    return float(1 - distance.cosine(left, right))


def load_payload() -> dict[str, Any]:
    return json.loads(sys.stdin.read())


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True)
    args = parser.parse_args()

    payload = load_payload()
    text = payload.get("text", "")
    candidates = [Candidate(**candidate) for candidate in payload.get("candidates", [])]

    model = sent2vec.Sent2vecModel()
    model.load_model(args.model)

    preprocessed_text = preprocess_sentence(text)
    query_vector = model.embed_sentence(preprocessed_text)[0]

    top_matches = []
    for candidate in candidates:
        candidate_vector = model.embed_sentence(preprocess_sentence(candidate.text))[0]
        top_matches.append(
            {
                "id": candidate.id,
                "similarity": round(cosine_similarity(query_vector, candidate_vector), 4),
            }
        )

    top_matches.sort(key=lambda match: match["similarity"], reverse=True)
    response = {
        "provider": "biosentvec",
        "preprocessedText": preprocessed_text,
        "vectorDimension": int(len(query_vector)),
        "topMatches": top_matches[:3],
    }
    sys.stdout.write(json.dumps(response))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())