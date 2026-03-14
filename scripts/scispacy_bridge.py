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
    model_name = payload.get("modelName", "en_core_sci_sm")
    linker_name = payload.get("linkerName", "")

    ensure_dependency("spacy", "Install spaCy and a SciSpaCy model to enable medical entity extraction.")
    ensure_dependency("scispacy", "Install scispacy to enable biomedical NLP extraction.")

    import spacy
    from scispacy.abbreviation import AbbreviationDetector

    try:
        nlp = spacy.load(model_name)
    except OSError as exc:
        raise RuntimeError(
            f"Install the SciSpaCy model '{model_name}' to enable medical entity extraction."
        ) from exc

    if "abbreviation_detector" not in nlp.pipe_names:
        nlp.add_pipe("abbreviation_detector")

    linker = None
    if linker_name:
        try:
            nlp.add_pipe(
                "scispacy_linker",
                config={"resolve_abbreviations": True, "linker_name": linker_name},
            )
            linker = nlp.get_pipe("scispacy_linker")
        except Exception as exc:
            raise RuntimeError(
                f"SciSpaCy linker '{linker_name}' could not be loaded. Disable SCISPACY_LINKER_NAME or install its resources."
            ) from exc

    doc = nlp(text)
    entities = []

    for ent in doc.ents:
        entity: dict[str, Any] = {
            "text": ent.text,
            "label": ent.label_ or "ENTITY",
            "start": ent.start_char,
            "end": ent.end_char,
        }

        long_form = getattr(ent._, "long_form", None)
        if long_form is not None and hasattr(long_form, "text"):
            entity["longForm"] = long_form.text

        if linker is not None:
            kb_ents = getattr(ent._, "kb_ents", [])[:3]
            links = []
            for concept_id, score in kb_ents:
                kb_entity = linker.kb.cui_to_entity.get(concept_id)
                links.append(
                    {
                        "id": concept_id,
                        "score": round(float(score), 4),
                        "name": getattr(kb_entity, "canonical_name", None),
                        "definition": getattr(kb_entity, "definition", None),
                    }
                )
            entity["links"] = links

        entities.append(entity)

    abbreviations = []
    for abbr in getattr(doc._, "abbreviations", []):
        long_form = getattr(abbr._, "long_form", None)
        if long_form is not None:
            abbreviations.append({"short": abbr.text, "long": getattr(long_form, "text", str(long_form))})

    response = {
        "provider": "scispacy",
        "model": model_name,
        "abbreviations": abbreviations,
        "entities": entities,
    }
    sys.stdout.write(json.dumps(response))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())