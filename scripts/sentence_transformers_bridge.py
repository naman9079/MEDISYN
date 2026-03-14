import json
import sys
from typing import Any


def load_payload() -> dict[str, Any]:
    return json.loads(sys.stdin.read())


def ensure_dependency(name: str, help_text: str):
    try:
        return __import__(name)
    except ImportError as exc:
        raise RuntimeError(help_text) from exc


def main() -> int:
    payload = load_payload()
    text = payload.get("text", "")
    model_name = payload.get("modelName", "all-MiniLM-L6-v2")
    candidates = payload.get("candidates", [])

    ensure_dependency("sentence_transformers", "Install sentence-transformers to enable embedding-based semantic search.")
    ensure_dependency("torch", "Install torch to run sentence-transformers models.")

    from sentence_transformers import SentenceTransformer, util

    model = SentenceTransformer(model_name)

    query_embedding = model.encode(text, convert_to_tensor=True, normalize_embeddings=True)
    candidate_texts = [candidate.get("text", "") for candidate in candidates]
    candidate_embeddings = model.encode(candidate_texts, convert_to_tensor=True, normalize_embeddings=True)

    similarities = util.cos_sim(query_embedding, candidate_embeddings)[0]

    scored = []
    for index, candidate in enumerate(candidates):
        score = float(similarities[index].item())
        scored.append({
            "id": candidate.get("id", ""),
            "similarity": round(score, 4),
        })

    scored.sort(key=lambda item: item["similarity"], reverse=True)

    response = {
        "provider": "sentence-transformers",
        "model": model_name,
        "topMatches": scored[:5],
    }
    sys.stdout.write(json.dumps(response))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())